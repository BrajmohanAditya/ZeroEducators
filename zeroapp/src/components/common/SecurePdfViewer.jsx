import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import {
  X,
  ShieldCheck,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react-native';

// Safely load WebView TurboModule to prevent fatal crash if APK not yet rebuilt
let WebView = null;
try {
  const RNWebViewModule = require('react-native-webview');
  WebView = RNWebViewModule?.WebView || RNWebViewModule?.default || RNWebViewModule;
} catch (err) {
  console.warn('Native WebView module not linked yet:', err?.message);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const SecurePdfViewer = ({
  visible,
  pdfUrl,
  title = 'Study Note PDF',
  user,
  onClose,
}) => {
  const webViewRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1.0);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      setHasError(false);
      setErrorMessage('');
      setZoomLevel(1.0);
      setTotalPages(0);
      setCurrentPage(1);
    }
  }, [visible, pdfUrl]);

  // HTML content rendering PDF securely via PDF.js with anti-download protection
  const htmlContent = useMemo(() => {
    if (!pdfUrl) return '';

    const sanitizedUrl = pdfUrl.replace(/"/g, '\\"');

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
  <title>Secure Document Viewer</title>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
  <style>
    * {
      box-sizing: border-box;
      -webkit-touch-callout: none;
      -webkit-user-select: none;
      -khtml-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    html, body {
      margin: 0;
      padding: 0;
      background-color: #0b0f19;
      color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      overflow-x: hidden;
      overflow-y: auto;
    }
    #pdf-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px 8px 40px;
      gap: 16px;
      transition: transform 0.2s ease;
      transform-origin: top center;
    }
    .page-wrapper {
      position: relative;
      background: #ffffff;
      border-radius: 8px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      max-width: 100%;
    }
    canvas {
      display: block;
      width: 100%;
      height: auto;
    }
    #loading-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding-top: 80px;
      color: #94a3b8;
    }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div id="pdf-container">
    <div id="loading-box">
      <div class="spinner"></div>
      <p style="font-size: 14px; font-weight: 500;">Securing & Loading Document...</p>
    </div>
  </div>

  <script>
    // Disable right-click & copy shortcuts
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('copy', e => e.preventDefault());
    document.addEventListener('selectstart', e => e.preventDefault());
    window.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'c', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    });

    const pdfUrl = "${sanitizedUrl}";

    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    function sendToNative(data) {
      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      }
    }

    async function loadPdf() {
      const container = document.getElementById('pdf-container');
      const loadingBox = document.getElementById('loading-box');

      try {
        const loadingTask = pdfjsLib.getDocument({
          url: pdfUrl,
          withCredentials: false,
        });

        loadingTask.onProgress = function(progressData) {
          if (progressData.total > 0) {
            const pct = Math.round((progressData.loaded / progressData.total) * 100);
            sendToNative({ type: 'PROGRESS', percent: pct });
          }
        };

        const pdfDoc = await loadingTask.promise;
        const numPages = pdfDoc.numPages;

        sendToNative({ type: 'LOADED', totalPages: numPages });
        loadingBox.style.display = 'none';

        // Render each page sequentially
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const dpr = Math.max(window.devicePixelRatio || 2, 2.0);
          const displayViewport = page.getViewport({ scale: 1.5 });
          const renderViewport = page.getViewport({ scale: 1.5 * dpr });

          const pageWrapper = document.createElement('div');
          pageWrapper.className = 'page-wrapper';
          pageWrapper.id = 'page-' + pageNum;

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d', { alpha: false });
          canvas.height = Math.floor(renderViewport.height);
          canvas.width = Math.floor(renderViewport.width);
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
          canvas.style.imageRendering = '-webkit-optimize-contrast';

          // Render PDF into canvas with high-DPI vector supersampling
          await page.render({
            canvasContext: context,
            viewport: renderViewport
          }).promise;

          pageWrapper.appendChild(canvas);
          container.appendChild(pageWrapper);
        }

        sendToNative({ type: 'COMPLETE' });

      } catch (err) {
        console.error('PDF render error:', err);
        sendToNative({ type: 'ERROR', message: err.message || 'Unable to open PDF' });
      }
    }

    // Zoom controller
    window.setDocZoom = function(scale) {
      const container = document.getElementById('pdf-container');
      if (container) {
        container.style.transform = 'scale(' + scale + ')';
      }
    };

    window.onload = loadPdf;
  </script>
</body>
</html>
    `;
  }, [pdfUrl]);

  // Handle messages sent from WebView
  const handleWebViewMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'LOADED') {
        setTotalPages(data.totalPages);
        setLoading(false);
      } else if (data.type === 'COMPLETE') {
        setLoading(false);
      } else if (data.type === 'ERROR') {
        setLoading(false);
        setHasError(true);
        setErrorMessage(data.message || 'Could not load PDF document.');
      }
    } catch (e) {
      // ignore
    }
  };

  const handleZoomIn = () => {
    const nextZoom = Math.min(zoomLevel + 0.25, 2.5);
    setZoomLevel(nextZoom);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.setDocZoom && window.setDocZoom(${nextZoom}); true;`);
    }
  };

  const handleZoomOut = () => {
    const nextZoom = Math.max(zoomLevel - 0.25, 0.75);
    setZoomLevel(nextZoom);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.setDocZoom && window.setDocZoom(${nextZoom}); true;`);
    }
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.setDocZoom && window.setDocZoom(1.0); true;`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0b0f19" />
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <X size={22} color="#f8fafc" />
          </TouchableOpacity>

          <View style={styles.headerTitleBox}>
            <View style={styles.secureBadgeRow}>
              <ShieldCheck size={13} color="#10b981" />
              <Text style={styles.secureBadgeText}>PROTECTED READER</Text>
            </View>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title}
            </Text>
          </View>

          {/* Zoom controls in header */}
          <View style={styles.zoomControls}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleZoomOut}
              activeOpacity={0.7}
              disabled={zoomLevel <= 0.75}
            >
              <ZoomOut size={18} color={zoomLevel <= 0.75 ? '#475569' : '#cbd5e1'} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleResetZoom}
              activeOpacity={0.7}
            >
              <Text style={styles.zoomText}>{Math.round(zoomLevel * 100)}%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.iconBtn}
              onPress={handleZoomIn}
              activeOpacity={0.7}
              disabled={zoomLevel >= 2.5}
            >
              <ZoomIn size={18} color={zoomLevel >= 2.5 ? '#475569' : '#cbd5e1'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Sub-header info banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoBannerText}>
            🔒 In-App Reader: Download & screenshots are restricted to protect study material.
          </Text>
          {totalPages > 0 && (
            <Text style={styles.pageCountBadge}>{totalPages} Pages</Text>
          )}
        </View>

        {/* Main Content Viewer */}
        <View style={styles.viewerContainer}>
          {hasError ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={44} color="#f43f5e" style={{ marginBottom: 12 }} />
              <Text style={styles.errorTitle}>Document Unavailable</Text>
              <Text style={styles.errorSubtitle}>
                {errorMessage || 'Unable to stream or render this PDF note securely.'}
              </Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={() => {
                  setHasError(false);
                  setLoading(true);
                  if (webViewRef.current) webViewRef.current.reload();
                }}
              >
                <RotateCcw size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : !WebView ? (
            <View style={styles.errorContainer}>
              <RefreshCw size={44} color="#6366f1" style={{ marginBottom: 12 }} />
              <Text style={styles.errorTitle}>App Rebuild Required</Text>
              <Text style={styles.errorSubtitle}>
                A new native module was added. Please rebuild the app binary by running:
                {'\n\n'}npm run android
              </Text>
            </View>
          ) : (
            <WebView
              ref={webViewRef}
              source={{ html: htmlContent, baseUrl: 'https://zeroeducators.com' }}
              style={styles.webView}
              originWhitelist={['*']}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              onMessage={handleWebViewMessage}
              startInLoadingState={false}
              showsVerticalScrollIndicator={true}
              showsHorizontalScrollIndicator={false}
              scalesPageToFit={false}
              bounces={false}
            />
          )}

          {loading && !hasError && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#6366f1" />
              <Text style={styles.loadingOverlayText}>Opening Secure Document...</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default SecurePdfViewer;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  header: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0f172a',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleBox: {
    flex: 1,
    marginHorizontal: 10,
  },
  secureBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  secureBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 2,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700',
    minWidth: 32,
    textAlign: 'center',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(99, 102, 241, 0.2)',
  },
  infoBannerText: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  pageCountBadge: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  viewerContainer: {
    flex: 1,
    backgroundColor: '#0b0f19',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0b0f19',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  loadingOverlayText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  errorSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#6366f1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
});
