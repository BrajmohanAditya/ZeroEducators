import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  Clock,
  BookOpen,
  FileText,
  ShieldCheck,
  Sparkles,
  Tag,
  Check,
} from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { enrollCourseApi, validateCouponApi } from '../../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const SingleCourse = ({ course, user, onBack, onNavigate, onEnroll }) => {
  const insets = useSafeAreaInsets();
  const currentCourse = course || {};

  // Pricing Plans
  const hasPlans = Boolean(
    currentCourse?.pricingPlans &&
      currentCourse.pricingPlans.length > 0 &&
      !currentCourse?.isFree
  );
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);

  // Coupon States
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { code, discountAmount, finalAmount }
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // Enrollment State
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [imgError, setImgError] = useState(false);

  const activePlan = hasPlans ? currentCourse.pricingPlans[selectedPlanIndex] : null;
  const activePrice = activePlan ? Number(activePlan.price) : Number(currentCourse?.amount || 0);
  const activeDuration = activePlan
    ? activePlan.duration
    : currentCourse?.duration
    ? currentCourse.duration
    : 'Lifetime Access';

  // Calculate Course Content Stats
  const totalPdfs = useMemo(() => {
    const subjectPdfs =
      currentCourse?.subjects?.reduce(
        (acc, s) =>
          acc +
          (s.chapters?.reduce((cAcc, c) => cAcc + (c.pdfs?.length || 0), 0) || 0),
        0
      ) || 0;
    const topicPdfs =
      currentCourse?.topics?.reduce((acc, t) => acc + (t.pdfs?.length || 0), 0) || 0;
    return subjectPdfs + topicPdfs;
  }, [currentCourse?.subjects, currentCourse?.topics]);

  const totalSubjectVideos = useMemo(() => {
    return (
      currentCourse?.subjects?.reduce(
        (acc, s) =>
          acc +
          (s.chapters?.reduce((cAcc, c) => cAcc + (c.videos?.length || 0), 0) || 0),
        0
      ) || 0
    );
  }, [currentCourse?.subjects]);

  const totalTopicVideos = useMemo(() => {
    return (
      currentCourse?.topics?.reduce((acc, t) => acc + (t.videos?.length || 0), 0) || 0
    );
  }, [currentCourse?.topics]);

  const totalVideos =
    totalSubjectVideos + totalTopicVideos > 0
      ? totalSubjectVideos + totalTopicVideos
      : currentCourse?.modules?.length || 0;

  const totalSubjectsCount = currentCourse?.subjects?.length || 0;
  const totalChaptersCount =
    currentCourse?.subjects?.reduce((acc, s) => acc + (s.chapters?.length || 0), 0) ||
    currentCourse?.topics?.length ||
    0;

  // Reset coupon when switching validity plan
  useEffect(() => {
    if (appliedCoupon) {
      setAppliedCoupon(null);
      Alert.alert('Plan Changed', 'Pricing plan changed. Please re-apply your coupon code.');
    }
  }, [selectedPlanIndex]);

  const isCourseFree = currentCourse?.isFree || Number(activePrice) === 0;
  const finalPayablePrice = appliedCoupon ? appliedCoupon.finalAmount : activePrice;
  const isFinalFree = isCourseFree || (appliedCoupon && appliedCoupon.finalAmount === 0);

  // Apply Coupon Handler
  const handleApplyCoupon = async () => {
    const cleanCode = couponInput.trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert('Coupon Required', 'Please enter a coupon code.');
      return;
    }

    setIsValidatingCoupon(true);
    try {
      const data = await validateCouponApi({
        code: cleanCode,
        courseId: currentCourse._id,
        planId: activePlan?._id,
        planDuration: activeDuration,
      });

      setAppliedCoupon({
        code: data?.coupon?.code || cleanCode,
        discountAmount: data?.discountAmount || 0,
        finalAmount: data?.finalAmount !== undefined ? data.finalAmount : activePrice,
      });
      Alert.alert('Success 🎉', `Coupon applied! You save ₹${data?.discountAmount || 0}`);
    } catch (err) {
      Alert.alert('Invalid Coupon', err?.message || 'Could not apply this coupon code.');
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
  };

  // Main Enrollment Handler
  const handleEnrollPress = async () => {
    if (!user) {
      Alert.alert(
        'Login Required',
        'Please log in to enroll in this course.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Login Now',
            onPress: () => {
              if (onNavigate) onNavigate('Login');
              else if (onEnroll) onEnroll(currentCourse);
            },
          },
        ]
      );
      return;
    }

    setIsEnrolling(true);
    try {
      const payload = {
        products: {
          _id: currentCourse._id,
          name: currentCourse.title,
          price: finalPayablePrice,
          image: currentCourse.thumbnail,
          planId: activePlan?._id,
          planDuration: activeDuration,
          couponCode: appliedCoupon?.code,
        },
        planId: activePlan?._id,
        planDuration: activeDuration,
        couponCode: appliedCoupon?.code,
      };

      const data = await enrollCourseApi(payload);

      // 1. Free Course / 100% Coupon
      if (data?.isFree) {
        setIsEnrolling(false);
        Alert.alert(
          'Enrolled Successfully 🎉',
          data?.message || 'You have been enrolled in this course!',
          [
            {
              text: 'Start Learning',
              onPress: () => {
                if (onEnroll) onEnroll(currentCourse);
                else if (onNavigate) onNavigate('CoursePlayer', { course: currentCourse });
              },
            },
          ]
        );
        return;
      }

      // 2. Paid Course via Cashfree
      if (data?.order?.paymentSessionId) {
        const paymentSessionId = data.order.paymentSessionId;
        const checkoutUrl = `https://payments.cashfree.com/order/#/${paymentSessionId}`;

        Alert.alert(
          'Complete Payment',
          `Order created for ₹${finalPayablePrice}. Proceed to secure payment.`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Pay Now',
              onPress: async () => {
                try {
                  await Linking.openURL(checkoutUrl);
                } catch (e) {
                  Alert.alert('Error', 'Could not open payment gateway.');
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Notice', data?.message || 'Order initiated.');
      }
    } catch (err) {
      Alert.alert('Enrollment Error', err?.message || 'Could not complete enrollment.');
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header with Back Button */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : 16,
            paddingBottom: 14,
          },
        ]}
      >
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>
          Course Details
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 24 },
        ]}
      >
        {/* Main Card Container (Matching Frontend mobile card) */}
        <View style={styles.cardContainer}>
          {/* Thumbnail Banner */}
          <View style={styles.thumbnailWrapper}>
            {currentCourse.thumbnail && !imgError ? (
              <Image
                source={{ uri: currentCourse.thumbnail }}
                style={styles.thumbnailImage}
                resizeMode="cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={styles.thumbnailFallback}>
                <BookOpen size={48} color="#d4af37" />
                <Text style={styles.fallbackTitle} numberOfLines={2}>
                  {currentCourse.title || 'Zero Educators Course'}
                </Text>
              </View>
            )}
          </View>

          {/* Details Content */}
          <View style={styles.detailsContent}>
            {/* Title */}
            <Text style={styles.title}>{currentCourse.title}</Text>

            {/* Meta Row (Subjects, Chapters, PDFs/Videos, Duration) */}
            <View style={styles.metaRow}>
              {currentCourse?.courseType === 'pdf' ? (
                <View style={styles.metaItem}>
                  <FileText size={15} color="#9333ea" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {totalSubjectsCount > 0
                      ? `${totalSubjectsCount} Subjects • `
                      : totalChaptersCount > 0
                      ? `${totalChaptersCount} Chapters • `
                      : ''}
                    {totalPdfs} {totalPdfs === 1 ? 'PDF' : 'PDFs'}
                  </Text>
                </View>
              ) : (
                <View style={styles.metaItem}>
                  <BookOpen size={15} color="#3b82f6" />
                  <Text style={styles.metaText} numberOfLines={1}>
                    {totalSubjectsCount > 0
                      ? `${totalSubjectsCount} Subjects • `
                      : totalChaptersCount > 0
                      ? `${totalChaptersCount} Chapters • `
                      : ''}
                    {totalVideos} {totalVideos === 1 ? 'Video' : 'Videos'}
                  </Text>
                </View>
              )}

              <View style={styles.metaItem}>
                <Clock size={15} color="#10b981" />
                <Text style={styles.metaText}>{activeDuration}</Text>
              </View>
            </View>

            {/* Choose Validity & Plan (Multi-Plan Selector) */}
            {hasPlans && currentCourse.pricingPlans.length > 1 && (
              <View style={styles.planSection}>
                <Text style={styles.sectionLabel}>CHOOSE VALIDITY & PLAN:</Text>
                <View style={styles.planGrid}>
                  {currentCourse.pricingPlans.map((plan, idx) => {
                    const isSelected = idx === selectedPlanIndex;
                    return (
                      <TouchableOpacity
                        key={idx}
                        activeOpacity={0.8}
                        onPress={() => setSelectedPlanIndex(idx)}
                        style={[
                          styles.planCard,
                          isSelected && styles.planCardActive,
                        ]}
                      >
                        <View style={styles.planHeaderRow}>
                          <Text
                            style={[
                              styles.planDuration,
                              isSelected && styles.planDurationActive,
                            ]}
                          >
                            {plan.duration}
                          </Text>
                          <View
                            style={[
                              styles.radioOuter,
                              isSelected && styles.radioOuterActive,
                            ]}
                          >
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </View>
                        <Text style={styles.planPrice}>₹{plan.price}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Coupon Code Section (Only for paid courses) */}
            {!isCourseFree && (
              <View style={styles.couponSection}>
                {appliedCoupon ? (
                  <View style={styles.appliedCouponCard}>
                    <View style={styles.appliedLeft}>
                      <View style={styles.sparkleBox}>
                        <Sparkles size={16} color="#047857" />
                      </View>
                      <View>
                        <View style={styles.codeBadgeRow}>
                          <Text style={styles.appliedCodeText}>
                            {appliedCoupon.code}
                          </Text>
                          <View style={styles.appliedBadge}>
                            <Text style={styles.appliedBadgeText}>APPLIED</Text>
                          </View>
                        </View>
                        <Text style={styles.savingsText}>
                          You save ₹{appliedCoupon.discountAmount}!
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={handleRemoveCoupon}
                      style={styles.removeCouponBtn}
                    >
                      <Text style={styles.removeCouponText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.couponInputGroup}>
                    <View style={styles.couponHeaderRow}>
                      <Tag size={13} color="#2563eb" />
                      <Text style={styles.sectionLabel}>HAVE A COUPON CODE?</Text>
                    </View>
                    <View style={styles.inputRow}>
                      <TextInput
                        value={couponInput}
                        onChangeText={(txt) =>
                          setCouponInput(txt.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))
                        }
                        placeholder="ENTER CODE"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters"
                        style={styles.couponTextInput}
                      />
                      <TouchableOpacity
                        onPress={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponInput.trim()}
                        style={[
                          styles.applyBtn,
                          (!couponInput.trim() || isValidatingCoupon) &&
                            styles.applyBtnDisabled,
                        ]}
                      >
                        {isValidatingCoupon ? (
                          <ActivityIndicator size="small" color="#ffffff" />
                        ) : (
                          <Text style={styles.applyBtnText}>Apply</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Price & Summary */}
            <View style={styles.priceSection}>
              {isCourseFree ? (
                <View style={styles.priceRow}>
                  <Text style={styles.freePriceText}>FREE</Text>
                  <View style={styles.freeBadge}>
                    <Text style={styles.freeBadgeText}>100% OFF</Text>
                  </View>
                </View>
              ) : appliedCoupon ? (
                <View>
                  <View style={styles.priceRow}>
                    <Text style={styles.mainPriceText}>
                      {isFinalFree ? 'FREE' : `₹${finalPayablePrice}`}
                    </Text>
                    <Text style={styles.strikethroughPrice}>₹{activePrice}</Text>
                    <View style={styles.discountBadge}>
                      <Text style={styles.discountBadgeText}>
                        -₹{appliedCoupon.discountAmount} OFF
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.couponNote}>
                    Coupon discount applied on this course!
                  </Text>
                </View>
              ) : (
                <View style={styles.priceRow}>
                  <Text style={styles.mainPriceText}>₹{activePrice}</Text>
                  <Text style={styles.strikethroughPrice}>
                    ₹{Math.round(activePrice * 1.3)}
                  </Text>
                  {activePlan && (
                    <View style={styles.planDurationBadge}>
                      <Text style={styles.planDurationBadgeText}>
                        {activePlan.duration}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Enroll CTA Button */}
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isEnrolling}
              onPress={handleEnrollPress}
              style={[
                styles.enrollBtn,
                isFinalFree ? styles.enrollBtnFree : styles.enrollBtnPaid,
                isEnrolling && { opacity: 0.7 },
              ]}
            >
              {isEnrolling ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.btnContentRow}>
                  <ShieldCheck size={20} color="#ffffff" />
                  <Text style={styles.enrollBtnText}>
                    {isFinalFree
                      ? appliedCoupon
                        ? 'Enroll for Free (Coupon Applied)'
                        : 'Enroll for Free'
                      : `Enroll for ₹${finalPayablePrice}`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // bg-slate-50
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...shadows.sm,
  },
  thumbnailWrapper: {
    width: '100%',
    height: 200,
    backgroundColor: '#f1f5f9',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#073b75',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fallbackTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 8,
  },
  detailsContent: {
    padding: 20,
  },
  title: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 28,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  planSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  planGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  planCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  planCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planDuration: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  planDurationActive: {
    color: '#1e40af',
  },
  radioOuter: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterActive: {
    borderColor: '#2563eb',
    backgroundColor: '#2563eb',
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  planPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  couponSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 16,
  },
  couponHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  couponInputGroup: {
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponTextInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: 1,
  },
  applyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnDisabled: {
    opacity: 0.5,
  },
  applyBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  appliedCouponCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 12,
  },
  appliedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sparkleBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  appliedCodeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#064e3b',
    letterSpacing: 0.5,
  },
  appliedBadge: {
    backgroundColor: '#a7f3d0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  appliedBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#065f46',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#047857',
    marginTop: 2,
  },
  removeCouponBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  removeCouponText: {
    color: '#ef4444',
    fontSize: 12,
    fontWeight: '700',
  },
  priceSection: {
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    flexWrap: 'wrap',
  },
  freePriceText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#059669',
  },
  freeBadge: {
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  freeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065f46',
  },
  mainPriceText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0f172a',
  },
  strikethroughPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
  },
  planDurationBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  planDurationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2563eb',
  },
  couponNote: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 3,
  },
  enrollBtn: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  enrollBtnFree: {
    backgroundColor: '#059669',
  },
  enrollBtnPaid: {
    backgroundColor: '#2563eb',
  },
  btnContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  enrollBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
});

export default SingleCourse;
