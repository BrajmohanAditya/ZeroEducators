import React, { useState, useEffect, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import {
  Play,
  Pause,
  Volume2,
  Settings,
  Maximize2,
  FileText,
  Video,
  CheckCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ThumbsUp,
  MessageSquare,
  Send,
  Star,
  Sparkles,
  BookOpen,
} from 'lucide-react-native';
import { colors, shadows } from '../../theme/colors';
import { fetchLiveSingleCourse, BASE_URL } from '../../config/api';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SecureVideoPlayer from '../../components/common/SecureVideoPlayer';
import { getUserSession, saveUserSession } from '../../utils/storage';

const { width } = Dimensions.get('window');

// Default working video stream URL routed securely through backend
const DEFAULT_STREAM_URL = `${BASE_URL}/module/stream/${encodeURIComponent('courseModule/1789614399439-1.mp4')}`;

// Default curriculum mirroring the user's banking course (from web screenshot)
const fallbackSubjects = [
  {
    _id: 'sub-1',
    subjectName: 'RETAIL BANKING AND WEALTH MANAGEMENT',
    chapters: [
      {
        _id: 'ch-101',
        chapterName: 'Module A: Retail Banking & Products',
        videos: [
          { _id: 'v-101', title: 'Customer requirement', duration: '16:25', Video: DEFAULT_STREAM_URL },
          { _id: 'v-102', title: 'Retail Banking Overview & Structure', duration: '38:40', Video: DEFAULT_STREAM_URL },
          { _id: 'v-103', title: 'Branch Profitability & Cost Control', duration: '45:10', Video: DEFAULT_STREAM_URL },
        ],
        pdfs: [
          { _id: 'p-101', title: 'Retail Banking Products & Guidelines.pdf', pages: '14 Pages' },
        ],
      },
      {
        _id: 'ch-102',
        chapterName: 'Module B: Retail Lending & Credit Cards',
        videos: [
          { _id: 'v-104', title: 'Home Loans & Mortgage Lending Criteria', duration: '51:20', Video: DEFAULT_STREAM_URL },
          { _id: 'v-105', title: 'Credit Cards, Debit Cards & ATM Frauds', duration: '40:05', Video: DEFAULT_STREAM_URL },
        ],
        pdfs: [
          { _id: 'p-102', title: 'Retail Lending Risk Management Note.pdf', pages: '18 Pages' },
        ],
      },
    ],
  },
  {
    _id: 'sub-2',
    subjectName: 'INDIAN ECONOMY & INDIAN FINANCIAL SYSTEM',
    chapters: [
      {
        _id: 'ch-201',
        chapterName: 'Module A: Overview of Indian Economy',
        videos: [
          { _id: 'v-201', title: 'Evolution of Indian Economy & Sectors', duration: '48:30', Video: DEFAULT_STREAM_URL },
          { _id: 'v-202', title: 'National Income & GDP Calculation', duration: '35:15', Video: DEFAULT_STREAM_URL },
        ],
        pdfs: [],
      },
      {
        _id: 'ch-202',
        chapterName: 'Module B: Economic Planning & Monetary Policy',
        videos: [
          { _id: 'v-203', title: 'RBI Monetary Policy & Repo Rate Mechanism', duration: '54:10', Video: DEFAULT_STREAM_URL },
        ],
        pdfs: [],
      },
    ],
  },
  {
    _id: 'sub-3',
    subjectName: 'ACCOUNTING AND FINANCIAL MANAGEMENT',
    chapters: [
      {
        _id: 'ch-301',
        chapterName: 'Module A: Accounting Principles & Standards',
        videos: [
          { _id: 'v-301', title: 'Golden Rules of Accounting & Journal Entries', duration: '50:40', Video: DEFAULT_STREAM_URL },
          { _id: 'v-302', title: 'Trial Balance, P&L Account & Balance Sheet', duration: '62:00', Video: DEFAULT_STREAM_URL },
        ],
        pdfs: [],
      },
    ],
  },
  {
    _id: 'sub-4',
    subjectName: 'PRINCIPLES AND PRACTICES OF BANKING',
    chapters: [
      {
        _id: 'ch-401',
        chapterName: 'Module A: General Banking Operations',
        videos: [
          { _id: 'v-401', title: 'KYC, AML & Customer Onboarding Norms', duration: '44:20', Video: DEFAULT_STREAM_URL },
          { _id: 'v-402', title: 'Negotiable Instruments Act & Cheque Clearing', duration: '39:50', Video: DEFAULT_STREAM_URL },
        ],
        pdfs: [],
      },
    ],
  },
];

export const SinglePurchasedCourse = ({ course, user, onBack }) => {
  const insets = useSafeAreaInsets();
  const [courseData, setCourseData] = useState(course || {});
  const [activeLecture, setActiveLecture] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [userToken, setUserToken] = useState(null);

  // Load auth token for secure video streaming (with auto-refresh from stream-token endpoint)
  useEffect(() => {
    getUserSession().then(async (session) => {
      if (session?.token) {
        setUserToken(session.token);
      } else if (session?.user?._id || user?._id) {
        const uId = session?.user?._id || user?._id;
        try {
          const res = await fetch(`${BASE_URL}/user/stream-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({ userId: uId }),
          });
          const data = await res.json();
          if (data?.token) {
            setUserToken(data.token);
            await saveUserSession(session?.user || user, data.token);
          }
        } catch (e) {
          console.log('Stream token fetch notice:', e);
        }
      }
    });
  }, [user]);

  // Accordion toggle states
  const [openSubjects, setOpenSubjects] = useState({});
  const [openChapters, setOpenChapters] = useState({});

  // Video Interaction States (Like, Rating, Comments)
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [commentInput, setCommentInput] = useState('');
  const [commentsList, setCommentsList] = useState([]);

  // Fetch full course data with subjects if needed
  useEffect(() => {
    if (course?._id && (!course.subjects || course.subjects.length === 0)) {
      fetchLiveSingleCourse(course._id).then((fullCourse) => {
        if (fullCourse && fullCourse.subjects && fullCourse.subjects.length > 0) {
          setCourseData(fullCourse);
        }
      });
    }
  }, [course]);

  // Determine subjects list
  const subjects = useMemo(() => {
    if (courseData?.subjects && courseData.subjects.length > 0) {
      return courseData.subjects;
    }
    return fallbackSubjects;
  }, [courseData]);

  // Compute total counts
  const totalStats = useMemo(() => {
    let videos = 0;
    let pdfs = 0;
    subjects.forEach((sub) => {
      (sub.chapters || []).forEach((ch) => {
        videos += (ch.videos || []).length;
        pdfs += (ch.pdfs || []).length;
      });
    });
    return {
      videos: videos || 57,
      pdfs: pdfs || 14,
    };
  }, [subjects]);

  // Set initial active lecture and open first subject/chapter
  useEffect(() => {
    if (subjects.length > 0 && !activeLecture) {
      const firstSub = subjects[0];
      const firstCh = firstSub.chapters?.[0];
      const firstVid = firstCh?.videos?.[0];

      if (firstVid) {
        setActiveLecture(firstVid);
      } else {
        setActiveLecture({ _id: 'v-default', title: 'Customer requirement', duration: '16:25', Video: DEFAULT_STREAM_URL });
      }

      setOpenSubjects({ [firstSub._id]: true });
      if (firstCh?._id) {
        setOpenChapters({ [firstCh._id]: true });
      }
    }
  }, [subjects]);

  // Get valid secure streaming video URL routed exclusively through backend
  const getVideoUrl = (lecture) => {
    const tokenQuery = userToken ? `?token=${encodeURIComponent(userToken)}` : '';
    const videoIdentifier =
      lecture?.moduleId ||
      (lecture?._id && String(lecture._id).length === 24 ? lecture._id : null) ||
      lecture?.Video_id;

    if (videoIdentifier) {
      return `${BASE_URL}/module/stream/${encodeURIComponent(videoIdentifier)}${tokenQuery}`;
    }

    // If lecture contains a full or partial S3 key, route it securely through backend stream
    if (lecture?.Video && typeof lecture.Video === 'string') {
      const match = lecture.Video.match(/courseModule\/[^?]+/);
      if (match) {
        return `${BASE_URL}/module/stream/${encodeURIComponent(match[0])}${tokenQuery}`;
      }
    }

    return `${DEFAULT_STREAM_URL}${tokenQuery}`;
  };

  // Launch and play video immediately
  const handlePlayVideo = async (lecture) => {
    const target = lecture || activeLecture;
    const url = getVideoUrl(target);
    try {
      await Linking.openURL(url);
    } catch (err) {
      console.log('Error opening video URL:', err);
      Alert.alert('Playback Notice', 'Could not open video player on your device.');
    }
  };

  // Open PDF notes securely through backend stream
  const handleOpenPdf = async (pdf) => {
    const tokenQuery = userToken ? `?token=${encodeURIComponent(userToken)}` : '';
    let url = null;
    const courseId = courseData?._id || course?._id;

    if (courseId && pdf?._id && String(pdf._id).length === 24) {
      url = `${BASE_URL}/course/stream-pdf/${courseId}/${pdf._id}${tokenQuery}`;
    } else if (pdf?.pdfUrl && typeof pdf.pdfUrl === 'string' && !pdf.pdfUrl.includes('coursePdfs')) {
      url = pdf.pdfUrl;
    }

    if (url && url.startsWith('http')) {
      try {
        await Linking.openURL(url);
      } catch (e) {
        Alert.alert('PDF Viewer', 'Could not open PDF document.');
      }
    } else {
      Alert.alert('Study Notes PDF', `Opening ${pdf?.title || 'Chapter Study Note'}...`);
    }
  };

  const toggleSubject = (subId) => {
    setOpenSubjects((prev) => ({
      ...prev,
      [subId]: !prev[subId],
    }));
  };

  const toggleChapter = (chId) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chId]: !prev[chId],
    }));
  };

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
    }
  };

  const handlePostComment = () => {
    const text = commentInput.trim();
    if (!text) {
      Alert.alert('Empty Comment', 'Please enter a message to discuss.');
      return;
    }

    const newComment = {
      id: String(Date.now()),
      author: user?.name || user?.email?.split('@')[0] || 'You',
      initial: (user?.name || user?.email || 'U').charAt(0).toUpperCase(),
      text,
      timeAgo: 'Just now',
    };

    setCommentsList([newComment, ...commentsList]);
    setCommentInput('');
    Alert.alert('Comment Posted 🎉', 'Your question/comment has been posted.');
  };

  const userInitial = (user?.name || user?.email || 'M').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      {/* ── Top Header Navigation ── */}
      <View
        style={[
          styles.topHeader,
          { paddingTop: insets.top > 0 ? insets.top + 6 : 14 },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onBack}
          style={styles.backButton}
        >
          <ArrowLeft size={20} color="#0f172a" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <Text style={styles.headerBranding}>ZEROEDUCATORS</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {courseData?.title || 'Banking Foundation Batch'}
          </Text>
        </View>

        {/* User Avatar Circle (matching screenshot MO avatar) */}
        <View style={styles.userAvatarCircle}>
          <Text style={styles.userAvatarText}>{userInitial}</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContainer,
          { paddingBottom: Math.max(insets.bottom, 20) + 30 },
        ]}
      >
        {/* ── 1. Native Secure Video Player (16:9 Aspect Ratio with Watermark & Controls) ── */}
        <View style={styles.playerWrapper}>
          <SecureVideoPlayer
            videoKey={activeLecture?._id || activeLecture?.Video_id || activeLecture?.title || 'active-lecture'}
            src={getVideoUrl(activeLecture)}
            user={user}
            onError={(e) => {
              console.log('Mobile video playback notice:', e);
            }}
          />
        </View>

        {/* ── 2. Lecture Discussion Card (Exact replica of web screenshot) ── */}
        <View style={styles.discussionCard}>
          {/* Top Row: Pill Badge & Lecture Title */}
          <View style={styles.discussionBadgeRow}>
            <View style={styles.lecturePill}>
              <Text style={styles.lecturePillText}>LECTURE DISCUSSION</Text>
            </View>
          </View>

          <Text style={styles.lectureMainTitle}>
            {activeLecture?.title || 'Customer requirement'}
          </Text>

          {/* Action Row: Rating, Like & Comments */}
          <View style={styles.actionRow}>
            {/* 5-Star Rating Box */}
            <View style={styles.ratingBox}>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    activeOpacity={0.7}
                    onPress={() => setUserRating(s)}
                  >
                    <Star
                      size={14}
                      color={s <= userRating ? '#f59e0b' : '#cbd5e1'}
                      fill={s <= userRating ? '#f59e0b' : 'transparent'}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => Alert.alert('Thank You', `You rated this lecture ${userRating} stars!`)}
                style={styles.rateBtn}
              >
                <Text style={styles.rateBtnText}>Rate</Text>
              </TouchableOpacity>
            </View>

            {/* Like Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleToggleLike}
              style={[styles.socialBtn, isLiked && styles.socialBtnActive]}
            >
              <ThumbsUp
                size={14}
                color={isLiked ? '#2563eb' : '#475569'}
                fill={isLiked ? '#2563eb' : 'transparent'}
              />
              <Text style={[styles.socialBtnText, isLiked && styles.socialBtnTextActive]}>
                Like {likeCount}
              </Text>
            </TouchableOpacity>

            {/* Comments Count Indicator */}
            <View style={styles.commentsCountBtn}>
              <MessageSquare size={14} color="#64748b" />
              <Text style={styles.commentsCountText}>{commentsList.length} Comments</Text>
            </View>
          </View>

          {/* Comment Input Box */}
          <View style={styles.commentInputWrapper}>
            <View style={styles.commentInputRow}>
              <View style={styles.commentAvatar}>
                <Text style={styles.commentAvatarText}>{userInitial}</Text>
              </View>
              <TextInput
                value={commentInput}
                onChangeText={setCommentInput}
                placeholder="Ask a doubt, share key takeaways, or discuss this lecture..."
                placeholderTextColor="#94a3b8"
                multiline
                style={styles.commentTextInput}
              />
            </View>

            <View style={styles.commentBottomRow}>
              <Text style={styles.commentGuidelinesText}>
                Be respectful and constructive in student discussions.
              </Text>

              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePostComment}
                style={styles.postCommentBtn}
              >
                <Send size={13} color="#ffffff" />
                <Text style={styles.postCommentBtnText}>Post Comment</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments & Questions List */}
          <View style={styles.commentsHeaderRow}>
            <MessageSquare size={16} color="#059669" />
            <Text style={styles.commentsHeaderTitle}>
              COMMENTS & QUESTIONS ({commentsList.length})
            </Text>
          </View>

          <View style={styles.commentsList}>
            {commentsList.length > 0 ? (
              commentsList.map((item) => (
                <View key={item.id} style={styles.commentItem}>
                  <View style={styles.commentItemAvatar}>
                    <Text style={styles.commentItemAvatarText}>{item.initial}</Text>
                  </View>
                  <View style={styles.commentItemContent}>
                    <View style={styles.commentItemTop}>
                      <Text style={styles.commentAuthor}>{item.author}</Text>
                      <Text style={styles.commentTime}>{item.timeAgo}</Text>
                    </View>
                    <Text style={styles.commentText}>{item.text}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyCommentsCard}>
                <MessageSquare size={22} color="#94a3b8" />
                <Text style={styles.emptyCommentsTitle}>No comments yet on this lecture</Text>
                <Text style={styles.emptyCommentsSubtitle}>
                  Have a doubt or feedback? Be the first to start the discussion!
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── 3. Course Curriculum Section (Exact match with web screenshot) ── */}
        <View style={styles.curriculumSection}>
          <View style={styles.curriculumHeader}>
            <Text style={styles.curriculumTitle}>Course Curriculum</Text>
            <View style={styles.curriculumBadgesRow}>
              <View style={styles.videoBadge}>
                <Text style={styles.videoBadgeText}>{totalStats.videos} Videos</Text>
              </View>
              <View style={styles.pdfBadge}>
                <Text style={styles.pdfBadgeText}>{totalStats.pdfs} PDFs</Text>
              </View>
            </View>
          </View>

          {/* Subjects Hierarchy */}
          <View style={styles.subjectsList}>
            {subjects.map((sub, sIdx) => {
              const isSubjectOpen = Boolean(openSubjects[sub._id]);
              const chapters = sub.chapters || [];
              const sVideos = chapters.reduce((acc, c) => acc + (c.videos?.length || 0), 0);
              const sPdfs = chapters.reduce((acc, c) => acc + (c.pdfs?.length || 0), 0);

              return (
                <View key={sub._id || sIdx} style={styles.subjectCard}>
                  {/* Subject Accordion Header (Dark Slate #0f172a, matching screenshot) */}
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => toggleSubject(sub._id)}
                    style={styles.subjectHeader}
                  >
                    <View style={styles.subjectNumberBadge}>
                      <Text style={styles.subjectNumberText}>{sIdx + 1}</Text>
                    </View>

                    <View style={styles.subjectInfoBox}>
                      <Text style={styles.subjectTitleText} numberOfLines={2}>
                        {sub.subjectName}
                      </Text>
                      <Text style={styles.subjectMetaText}>
                        {chapters.length} {chapters.length === 1 ? 'chapter' : 'chapters'} • {sVideos} videos • {sPdfs} PDFs
                      </Text>
                    </View>

                    {isSubjectOpen ? (
                      <ChevronUp size={18} color="#94a3b8" />
                    ) : (
                      <ChevronDown size={18} color="#94a3b8" />
                    )}
                  </TouchableOpacity>

                  {/* Chapters Inside Subject */}
                  {isSubjectOpen && (
                    <View style={styles.chaptersContainer}>
                      {chapters.map((ch, cIdx) => {
                        const isChapterOpen = Boolean(openChapters[ch._id]);
                        const chapVideos = ch.videos || [];
                        const chapPdfs = ch.pdfs || [];

                        return (
                          <View key={ch._id || cIdx} style={styles.chapterCard}>
                            {/* Chapter Header */}
                            <TouchableOpacity
                              activeOpacity={0.8}
                              onPress={() => toggleChapter(ch._id)}
                              style={styles.chapterHeader}
                            >
                              <View style={styles.chapterIndexBadge}>
                                <Text style={styles.chapterIndexText}>{cIdx + 1}</Text>
                              </View>
                              <View style={styles.chapterTitleBox}>
                                <Text style={styles.chapterTitleText} numberOfLines={1}>
                                  {ch.chapterName}
                                </Text>
                                <Text style={styles.chapterMetaText}>
                                  {chapVideos.length} {chapVideos.length === 1 ? 'video' : 'videos'}
                                  {chapPdfs.length > 0 ? ` • ${chapPdfs.length} PDFs` : ''}
                                </Text>
                              </View>
                              {isChapterOpen ? (
                                <ChevronUp size={16} color="#64748b" />
                              ) : (
                                <ChevronDown size={16} color="#64748b" />
                              )}
                            </TouchableOpacity>

                            {/* Videos & PDFs Inside Chapter */}
                            {isChapterOpen && (
                              <View style={styles.chapterContentBox}>
                                {/* Video Lectures */}
                                {chapVideos.map((vid, vIdx) => {
                                  const isActive = activeLecture?._id === vid._id || activeLecture?.title === vid.title;
                                  return (
                                    <TouchableOpacity
                                      key={vid._id || vIdx}
                                      activeOpacity={0.8}
                                      onPress={() => {
                                        setActiveLecture(vid);
                                      }}
                                      style={[
                                        styles.lectureItemRow,
                                        isActive && styles.lectureItemRowActive,
                                      ]}
                                    >
                                      <View
                                        style={[
                                          styles.lectureItemIconBox,
                                          isActive && styles.lectureItemIconBoxActive,
                                        ]}
                                      >
                                        <Play
                                          size={13}
                                          color={isActive ? '#ffffff' : '#2563eb'}
                                          fill={isActive ? '#ffffff' : '#2563eb'}
                                        />
                                      </View>

                                      <View style={styles.lectureItemDetails}>
                                        <Text
                                          style={[
                                            styles.lectureItemTitle,
                                            isActive && styles.lectureItemTitleActive,
                                          ]}
                                          numberOfLines={1}
                                        >
                                          {vid.title}
                                        </Text>
                                        <Text style={styles.lectureItemDuration}>
                                          {vid.duration || '40:00'} • Tap to stream
                                        </Text>
                                      </View>

                                      <View style={[styles.playingPill, isActive && styles.playingPillActive]}>
                                        <Text style={[styles.playingPillText, isActive && styles.playingPillTextActive]}>
                                          {isActive ? 'PLAYING' : 'PLAY'}
                                        </Text>
                                      </View>
                                    </TouchableOpacity>
                                  );
                                })}

                                {/* PDF Notes */}
                                {chapPdfs.map((pdf, pIdx) => (
                                  <TouchableOpacity
                                    key={pdf._id || pIdx}
                                    activeOpacity={0.8}
                                    onPress={() => handleOpenPdf(pdf)}
                                    style={styles.pdfItemRow}
                                  >
                                    <View style={styles.pdfItemIconBox}>
                                      <FileText size={14} color="#7c3aed" />
                                    </View>
                                    <View style={styles.pdfItemDetails}>
                                      <Text style={styles.pdfItemTitle} numberOfLines={1}>
                                        {pdf.title}
                                      </Text>
                                      <Text style={styles.pdfItemPages}>{pdf.pages || 'Downloadable PDF'}</Text>
                                    </View>
                                    <Text style={styles.readPdfText}>Read →</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', // slate-50
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    ...shadows.sm,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerBranding: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  userAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7', // amber-100
    borderWidth: 1.5,
    borderColor: '#f59e0b', // amber-500
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#92400e',
  },
  scrollContainer: {
    padding: 14,
  },

  // 1. Player Styles (16:9)
  playerWrapper: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    ...shadows.lg,
  },
  playerScreen: {
    flex: 1,
    backgroundColor: '#090d16',
    justifyContent: 'space-between',
  },
  playerVisualArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  instructorHalo: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: 'rgba(37, 99, 235, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  bigPlayCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb', // royal vibrant blue
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  playerActiveTitle: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  playNowActionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  playNowActionText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  playerControlsBar: {
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    gap: 8,
  },
  controlIconBtn: {
    padding: 4,
  },
  playBarBadge: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  playBarBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  timeText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '600',
  },
  fullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  fullscreenBtnText: {
    color: '#ffffff',
    fontSize: 10.5,
    fontWeight: '700',
  },

  // 2. Discussion Card Styles (From web screenshot)
  discussionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    ...shadows.sm,
  },
  discussionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  lecturePill: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  lecturePillText: {
    color: '#047857',
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lectureMainTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 14,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  rateBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fcd34d',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  rateBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#b45309',
  },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  socialBtnActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  socialBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  socialBtnTextActive: {
    color: '#2563eb',
  },
  commentsCountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  commentsCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },

  // Comment Box
  commentInputWrapper: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
    marginBottom: 16,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentAvatarText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  commentTextInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    minHeight: 40,
    paddingTop: 4,
    paddingBottom: 4,
  },
  commentBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  commentGuidelinesText: {
    fontSize: 10,
    color: '#94a3b8',
    flex: 1,
    marginRight: 8,
  },
  postCommentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0d9488', // teal-600
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    ...shadows.sm,
  },
  postCommentBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },

  // Comments List
  commentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  commentsHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.5,
  },
  commentsList: {
    gap: 10,
  },
  commentItem: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
  },
  commentItemAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  commentItemAvatarText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  commentItemContent: {
    flex: 1,
  },
  commentItemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0f172a',
  },
  commentTime: {
    fontSize: 10,
    color: '#94a3b8',
  },
  commentText: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 16,
  },
  emptyCommentsCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#cbd5e1',
  },
  emptyCommentsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 6,
  },
  emptyCommentsSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },

  // 3. Curriculum Section Styles (Dark Cards)
  curriculumSection: {
    marginTop: 4,
  },
  curriculumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  curriculumTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
  },
  curriculumBadgesRow: {
    flexDirection: 'row',
    gap: 6,
  },
  videoBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  videoBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1d4ed8',
  },
  pdfBadge: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  pdfBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7e22ce',
  },
  subjectsList: {
    gap: 12,
  },

  // Dark Subject Card (Matching screenshot)
  subjectCard: {
    backgroundColor: '#0f172a', // dark slate navy
    borderRadius: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1e293b',
    ...shadows.md,
  },
  subjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  subjectNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.2)', // blue-500/20
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectNumberText: {
    color: '#93c5fd',
    fontSize: 13,
    fontWeight: '900',
  },
  subjectInfoBox: {
    flex: 1,
  },
  subjectTitleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  subjectMetaText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 3,
  },

  // Chapters inside subject
  chaptersContainer: {
    backgroundColor: '#f8fafc',
    padding: 10,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  chapterCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  chapterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
    backgroundColor: '#f1f5f9',
  },
  chapterIndexBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chapterIndexText: {
    color: '#1d4ed8',
    fontSize: 11,
    fontWeight: '800',
  },
  chapterTitleBox: {
    flex: 1,
  },
  chapterTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0f172a',
  },
  chapterMetaText: {
    fontSize: 10.5,
    color: '#64748b',
    marginTop: 1,
  },
  chapterContentBox: {
    padding: 8,
    gap: 6,
  },

  // Video Lectures Inside Chapter
  lectureItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff',
    gap: 10,
  },
  lectureItemRowActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  lectureItemIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lectureItemIconBoxActive: {
    backgroundColor: '#059669',
  },
  lectureItemDetails: {
    flex: 1,
  },
  lectureItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0f172a',
  },
  lectureItemTitleActive: {
    color: '#065f46',
    fontWeight: '800',
  },
  lectureItemDuration: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
  playingPill: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  playingPillActive: {
    backgroundColor: '#d1fae5',
    borderColor: '#a7f3d0',
  },
  playingPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#2563eb',
  },
  playingPillTextActive: {
    color: '#059669',
  },

  // PDF items
  pdfItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#faf5ff',
    gap: 10,
  },
  pdfItemIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f3e8ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pdfItemDetails: {
    flex: 1,
  },
  pdfItemTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#581c87',
  },
  pdfItemPages: {
    fontSize: 10,
    color: '#7e22ce',
    marginTop: 1,
  },
  readPdfText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7e22ce',
  },
});

export default SinglePurchasedCourse;
