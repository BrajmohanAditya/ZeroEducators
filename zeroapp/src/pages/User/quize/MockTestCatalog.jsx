import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import {
  Crown,
  Search,
  X,
  ArrowLeft,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Layers,
  ShieldCheck,
  Sparkles,
} from 'lucide-react-native';
import { fetchLiveExams, fetchMyPurchasedExamsApi } from '../../../config/api';

const { width } = Dimensions.get('window');

export const MockTestCatalog = ({
  user,
  token,
  purchasedExams = [],
  onSelectExam,
  onBack,
}) => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [myPurchasedIds, setMyPurchasedIds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      try {
        const [allEx, purchasedRes] = await Promise.all([
          fetchLiveExams(),
          token ? fetchMyPurchasedExamsApi(token) : Promise.resolve([]),
        ]);
        if (!isMounted) return;
        setExams(allEx || []);

        const idsFromProps = (purchasedExams || []).map((e) => String(e._id || e.id || e));
        const idsFromApi = (purchasedRes || []).map((e) => String(e._id || e.id || e));
        setMyPurchasedIds(Array.from(new Set([...idsFromProps, ...idsFromApi])));
      } catch (err) {
        console.warn('Error loading mock test catalog:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, [token, purchasedExams]);

  // Categories
  const categories = useMemo(() => {
    const set = new Set(['All']);
    (exams || []).forEach((e) => {
      if (e.category?.trim()) set.add(e.category.trim());
    });
    return Array.from(set);
  }, [exams]);

  // Filtered exams
  const filteredExams = useMemo(() => {
    return (exams || []).filter((exam) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (exam.title || '').toLowerCase().includes(q) ||
        (exam.description || '').toLowerCase().includes(q);

      const isPurchased = myPurchasedIds.includes(String(exam._id || exam.id));
      const matchesCategory =
        selectedCategory === 'All' ||
        (selectedCategory === 'Unlocked' && isPurchased) ||
        exam.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [exams, searchQuery, selectedCategory, myPurchasedIds]);

  const totalTests = useMemo(() => {
    return (exams || []).reduce((acc, curr) => acc + (curr.totalQuizzes || 0), 0);
  }, [exams]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Card */}
      <View style={styles.headerBox}>
        {onBack && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onBack}
            style={styles.backBtn}
          >
            <ArrowLeft size={16} color="#0f172a" />
            <Text style={styles.backBtnText}>Study Dashboard</Text>
          </TouchableOpacity>
        )}

        <View style={styles.badgeRow}>
          <Crown size={14} color="#059669" />
          <Text style={styles.badgeText}>PREMIUM TEST SERIES</Text>
        </View>

        <Text style={styles.title}>All Mock Tests</Text>
        <Text style={styles.subtitle}>
          Full-length sets, sectional tests, and PYPs with complete solutions.
        </Text>

        {/* Quick Stats Pill */}
        <View style={styles.statsRow}>
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{exams.length}</Text>
            <Text style={styles.statLabel}>Packages</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statChip}>
            <Text style={styles.statNum}>{totalTests}+</Text>
            <Text style={styles.statLabel}>Tests</Text>
          </View>
          {myPurchasedIds.length > 0 && (
            <>
              <View style={styles.statDivider} />
              <View style={styles.statChip}>
                <Text style={[styles.statNum, { color: '#059669' }]}>
                  {myPurchasedIds.length}
                </Text>
                <Text style={styles.statLabel}>Unlocked</Text>
              </View>
            </>
          )}
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={18} color="#94a3b8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exam (JAIIB, UIICL)..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.8}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryChip,
                selectedCategory === cat && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat === 'All' ? 'All Exams' : cat}
              </Text>
            </TouchableOpacity>
          ))}

          {myPurchasedIds.length > 0 && (
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setSelectedCategory('Unlocked')}
              style={[
                styles.categoryChip,
                selectedCategory === 'Unlocked' && styles.categoryChipActive,
              ]}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === 'Unlocked' && styles.categoryChipTextActive,
                ]}
              >
                My Unlocked ({myPurchasedIds.length})
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Loading state */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#059669" />
          <Text style={styles.loadingText}>Loading mock test series...</Text>
        </View>
      ) : filteredExams.length === 0 ? (
        <View style={styles.emptyCard}>
          <GraduationCap size={40} color="#94a3b8" />
          <Text style={styles.emptyTitle}>No Mock Tests Found</Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery
              ? `No tests match "${searchQuery}".`
              : 'No mock tests in this category yet.'}
          </Text>
        </View>
      ) : (
        /* Exam Cards List */
        <View style={styles.cardsGrid}>
          {filteredExams.map((exam) => {
            const isPurchased = myPurchasedIds.includes(String(exam._id || exam.id));
            const count = exam.totalQuizzes || 0;

            return (
              <TouchableOpacity
                key={exam._id || exam.id}
                activeOpacity={0.9}
                onPress={() => onSelectExam && onSelectExam(exam)}
                style={styles.examCard}
              >
                {/* Header row: Status badge + Category */}
                <View style={styles.cardTopRow}>
                  {isPurchased ? (
                    <View style={styles.unlockedBadge}>
                      <CheckCircle2 size={12} color="#059669" />
                      <Text style={styles.unlockedBadgeText}>UNLOCKED</Text>
                    </View>
                  ) : (
                    <View style={styles.paidBadge}>
                      <Sparkles size={12} color="#d97706" />
                      <Text style={styles.paidBadgeText}>PREMIUM</Text>
                    </View>
                  )}

                  {exam.category && (
                    <Text style={styles.categoryText}>{exam.category}</Text>
                  )}
                </View>

                {/* Logo + Title */}
                <View style={styles.cardMainRow}>
                  <View style={styles.logoBox}>
                    {exam.logoUrl ? (
                      <Image
                        source={{ uri: exam.logoUrl }}
                        style={styles.logoImg}
                        resizeMode="contain"
                      />
                    ) : (
                      <Crown size={24} color="#059669" />
                    )}
                  </View>
                  <View style={styles.titleCol}>
                    <Text style={styles.examTitle} numberOfLines={2}>
                      {exam.title || exam.name}
                    </Text>
                    <Text style={styles.examDesc} numberOfLines={2}>
                      {exam.description ||
                        'Practice full-length mocks, sectionals, and PYPs.'}
                    </Text>
                  </View>
                </View>

                {/* Stats Highlights */}
                <View style={styles.cardFeaturesBox}>
                  <View style={styles.featureItem}>
                    <Layers size={14} color="#059669" />
                    <Text style={styles.featureText}>
                      {count > 0 ? `${count} Mock Tests` : 'Tests Available'}
                    </Text>
                  </View>
                  <View style={styles.featureItem}>
                    <ShieldCheck size={14} color="#3b82f6" />
                    <Text style={styles.featureText}>All-India Ranks</Text>
                  </View>
                </View>

                {/* Footer Action */}
                <View style={styles.cardFooter}>
                  <View>
                    {isPurchased ? (
                      <Text style={styles.activeAccessText}>Enrolled & Active</Text>
                    ) : (
                      <Text style={styles.priceText}>
                        {exam.price ? `₹${exam.price}` : 'Free Demo Tests'}
                      </Text>
                    )}
                  </View>

                  <View style={styles.startBtn}>
                    <Text style={styles.startBtnText}>
                      {isPurchased ? 'Start Practice' : 'Explore'}
                    </Text>
                    <ArrowRight size={13} color="#ffffff" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

export default MockTestCatalog;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerBox: {
    backgroundColor: '#E6F8EA',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 14,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#d1fae5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#475569',
    marginTop: 4,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 14,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statChip: {
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#e2e8f0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginTop: 14,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    paddingVertical: 0,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingBottom: 2,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
  },
  categoryChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  categoryChipTextActive: {
    color: '#ffffff',
  },
  loaderContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 12,
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    margin: 20,
    padding: 30,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  cardsGrid: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  examCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  unlockedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065f46',
  },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  paidBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400e',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  logoBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  logoImg: {
    width: '100%',
    height: '100%',
  },
  titleCol: {
    flex: 1,
  },
  examTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },
  examDesc: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  cardFeaturesBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featureText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  activeAccessText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  priceText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0f172a',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  startBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});

