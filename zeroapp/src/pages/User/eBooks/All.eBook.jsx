import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { BookOpen, Search, X, ChevronRight, FileText, ArrowLeft } from 'lucide-react-native';
import { colors, shadows } from '../../../theme/colors';
import { fetchLiveEbooks } from '../../../config/api';

export const AllEbooks = ({ onSelectEbook, onBack }) => {
  const [ebooks, setEbooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    loadEbooks();
  }, []);

  const loadEbooks = async () => {
    setLoading(true);
    try {
      const data = await fetchLiveEbooks();
      setEbooks(data || []);
    } catch (e) {
      console.warn('[AllEbooks] Error loading ebooks:', e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = ebooks.filter((b) =>
    (b.title || '').toLowerCase().includes(query.toLowerCase())
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <ArrowLeft size={16} color="#64748b" />
            <Text style={styles.backBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        )}

        <View style={styles.titleRow}>
          <BookOpen size={24} color="#4f46e5" />
          <Text style={styles.title}>Practice Books & eBooks</Text>
        </View>
        <Text style={styles.subtitle}>
          Select an eBook to study chapters or practice topic-wise questions.
        </Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBox}>
        <Search size={18} color="#94a3b8" />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search eBook..."
          placeholderTextColor="#94a3b8"
          style={styles.searchInput}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <X size={16} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading state */}
      {loading && ebooks.length === 0 ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading eBooks...</Text>
        </View>
      ) : null}

      {/* Empty state */}
      {!loading && filtered.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconCircle}>
            <FileText size={28} color="#94a3b8" />
          </View>
          <Text style={styles.emptyTitle}>No eBooks Found</Text>
          <Text style={styles.emptySubtitle}>
            There are no matching eBooks available. Check back later!
          </Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {filtered.map((ebook) => (
            <TouchableOpacity
              key={ebook._id}
              activeOpacity={0.85}
              onPress={() => onSelectEbook && onSelectEbook(ebook)}
              style={styles.ebookCard}
            >
              <View style={styles.coverBox}>
                {ebook.thumbnail ? (
                  <Image
                    source={{ uri: ebook.thumbnail }}
                    style={styles.coverImage}
                    resizeMode="cover"
                  />
                ) : (
                  <FileText size={32} color="#cbd5e1" />
                )}

                {/* Price Tag Overlay */}
                <View style={styles.priceTag}>
                  <Text style={styles.priceTagText}>
                    {ebook.amount > 0 ? `₹${ebook.amount}` : 'FREE'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.ebookTitle} numberOfLines={1}>
                  {ebook.title}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.chapterBadge}>
                    {ebook.numberOfChapters || 0} Ch
                  </Text>
                  {ebook.maxQuestionsPerChapter > 0 && (
                    <Text style={styles.limitBadge}>
                      {ebook.maxQuestionsPerChapter} Qs
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 20,
    gap: 8,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    paddingVertical: 0,
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: '#64748b',
  },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...shadows.sm,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 16,
  },
  ebookCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    ...shadows.sm,
  },
  coverBox: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  priceTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  cardContent: {
    padding: 10,
  },
  ebookTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chapterBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  limitBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4f46e5',
    backgroundColor: '#eef2ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
});

export default AllEbooks;
