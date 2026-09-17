import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCheck,
  Download,
  FileText,
  Inbox,
  LoaderCircle,
  MessagesSquare,
  Paperclip,
  Plus,
  Search,
  SearchX,
  SendHorizontal,
  Trash2,
  X
} from 'lucide-react';
import './TeacherParentChat.css';
import NewConversationModal from './NewConversationModal';
import {
  getUserConversations,
  getConversationMessages,
  markConversationAsRead,
  sendMessage,
  deleteConversation,
  getInitials
} from '../utils/conversationUtils';

const REFRESH_INTERVAL_MS = 3000;
const MAX_FILE_SIZE = 5 * 1024 * 1024;
// Consecutive messages from one sender within this window are visually grouped
const GROUP_WINDOW_MS = 5 * 60 * 1000;
const EMPTY_THREAD = { conversationId: null, messages: [], signature: '', initialIds: new Set() };

const translations = {
  en: {
    title: 'Teacher-Parent Communication',
    shortTitle: 'Messages',
    subtitleParent: "Stay in touch with your child's teachers",
    subtitleTeacher: 'Keep families in the loop',
    back: 'Back',
    backHome: 'Back to home',
    backToConversations: 'Back to conversations',
    conversations: 'Conversations',
    all: 'All',
    unread: 'Unread',
    newConversation: 'New message',
    startConversation: 'Start a conversation',
    searchPlaceholder: 'Search…',
    noConversations: 'No conversations yet',
    noUnread: "You're all caught up",
    noResults: 'No matching conversations',
    welcomeTitle: 'Start the conversation',
    welcomeBody: 'Send a message to share progress, ask a question, or plan a meeting.',
    selectTitle: 'Your messages',
    selectBody: 'Pick a conversation from the list to read and reply.',
    noMessages: 'No messages yet. Say hello!',
    typeMessage: 'Write a message…',
    send: 'Send',
    pressEnter: 'Enter to send · Shift + Enter for a new line',
    teacher: 'Teacher',
    parent: 'Parent',
    you: 'You',
    unknownUser: 'Unknown user',
    today: 'Today',
    yesterday: 'Yesterday',
    attachment: 'Attachment',
    attachFile: 'Attach a file',
    removeFile: 'Remove',
    download: 'Download',
    sent: 'Sent',
    read: 'Read',
    fileTooLarge: 'Files larger than 5 MB were skipped.',
    sendFailed: "Couldn't send the message. Attachments may be too large to store on this device.",
    dismiss: 'Dismiss',
    deleteConversation: 'Delete conversation',
    deleteTitle: 'Delete this conversation?',
    deleteBody: (name) => `All messages with ${name} will be removed for both of you. This can't be undone.`,
    cancel: 'Cancel',
    delete: 'Delete'
  },
  ar: {
    title: 'التواصل بين المعلمين والأهل',
    shortTitle: 'الرسائل',
    subtitleParent: 'ابقَ على تواصل مع معلمي طفلك',
    subtitleTeacher: 'أبقِ الأهل على اطلاع دائم',
    back: 'رجوع',
    backHome: 'العودة إلى الرئيسية',
    backToConversations: 'العودة إلى المحادثات',
    conversations: 'المحادثات',
    all: 'الكل',
    unread: 'غير مقروءة',
    newConversation: 'رسالة جديدة',
    startConversation: 'ابدأ محادثة',
    searchPlaceholder: 'بحث…',
    noConversations: 'لا توجد محادثات بعد',
    noUnread: 'لا توجد رسائل غير مقروءة',
    noResults: 'لا توجد محادثات مطابقة',
    welcomeTitle: 'ابدأ المحادثة',
    welcomeBody: 'أرسل رسالة لمشاركة التقدم أو طرح سؤال أو ترتيب لقاء.',
    selectTitle: 'رسائلك',
    selectBody: 'اختر محادثة من القائمة لقراءتها والرد عليها.',
    noMessages: 'لا توجد رسائل بعد. ابدأ بالتحية!',
    typeMessage: 'اكتب رسالتك…',
    send: 'إرسال',
    pressEnter: 'Enter للإرسال · Shift + Enter لسطر جديد',
    teacher: 'معلم',
    parent: 'ولي أمر',
    you: 'أنت',
    unknownUser: 'مستخدم غير معروف',
    today: 'اليوم',
    yesterday: 'أمس',
    attachment: 'مرفق',
    attachFile: 'إرفاق ملف',
    removeFile: 'إزالة',
    download: 'تحميل',
    sent: 'تم الإرسال',
    read: 'تمت القراءة',
    fileTooLarge: 'تم تجاهل الملفات التي يزيد حجمها عن 5 ميجابايت.',
    sendFailed: 'تعذر إرسال الرسالة. قد تكون المرفقات أكبر من مساحة التخزين المتاحة.',
    dismiss: 'إغلاق',
    deleteConversation: 'حذف المحادثة',
    deleteTitle: 'حذف هذه المحادثة؟',
    deleteBody: (name) => `سيتم حذف جميع الرسائل مع ${name} لكلا الطرفين. لا يمكن التراجع عن ذلك.`,
    cancel: 'إلغاء',
    delete: 'حذف'
  }
};

const readUsers = () => {
  try {
    return JSON.parse(localStorage.getItem('stellar_users') || '{}');
  } catch (error) {
    return {};
  }
};

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const formatFileSize = (bytes = 0) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const isSameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

const isImageAttachment = (attachment) => (attachment?.type || '').startsWith('image/');

const roleKey = (role) => (role === 'teacher' || role === 'parent' ? role : 'other');

const Avatar = ({ name, role, picture, size = 'md' }) => (
  <span className={`tpc-avatar tpc-avatar--${size} tpc-avatar--${roleKey(role)}`} aria-hidden="true">
    {picture ? <img src={picture} alt="" /> : getInitials(name)}
  </span>
);

const TeacherParentChat = ({ currentUserEmail, userRole, language = 'en', onBack }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(EMPTY_THREAD);
  const [draft, setDraft] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [composerError, setComposerError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const messagesListRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const selectedIdRef = useRef(null);
  const conversationsJsonRef = useRef('');
  const lastScrollRef = useRef({ conversationId: null, count: 0 });

  const t = translations[language] || translations.en;
  const isRTL = language === 'ar';
  const locale = isRTL ? 'ar-EG' : 'en-US';
  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const loadConversations = useCallback(() => {
    if (!currentUserEmail) return;

    const users = readUsers();
    const list = getUserConversations(currentUserEmail)
      .filter(conv => !conv.archived)
      .map(conv => {
        const other = users[conv.otherParticipant?.toLowerCase()] || {};
        return {
          id: conv.id,
          otherParticipant: conv.otherParticipant || '',
          otherName: other.name || '',
          otherRole: other.role || null,
          otherPicture: other.profilePicture || null,
          childName: conv.childName || '',
          lastMessage: conv.lastMessage || '',
          lastAttachmentCount: conv.lastAttachmentCount || 0,
          lastSender: conv.lastSender || null,
          lastMessageTime: conv.lastMessageTime || conv.createdAt || 0,
          unreadCount: getConversationMessages(conv.id)
            .filter(msg => !msg.read && msg.sender !== currentUserEmail).length
        };
      });

    // Polling rebuilds the list every few seconds — only re-render when it changed
    const json = JSON.stringify(list);
    if (json !== conversationsJsonRef.current) {
      conversationsJsonRef.current = json;
      setConversations(list);
    }
  }, [currentUserEmail]);

  const loadMessages = useCallback((conversationId) => {
    if (!conversationId) return;

    markConversationAsRead(conversationId, currentUserEmail);
    const messages = getConversationMessages(conversationId);
    // Cheap change check: attachments hold base64 data, so don't stringify them
    const signature = messages.map(msg => `${msg.id}:${msg.sender}:${msg.read ? 1 : 0}`).join('|');

    setThread(prev => {
      if (prev.conversationId === conversationId && prev.signature === signature) return prev;
      return {
        conversationId,
        messages,
        signature,
        // Messages already present when a thread opens render without the pop-in animation
        initialIds: prev.conversationId === conversationId
          ? prev.initialIds
          : new Set(messages.map(msg => msg.id))
      };
    });
  }, [currentUserEmail]);

  const refresh = useCallback(() => {
    // Messages first: opening a thread marks it read, which the list's unread counts reflect
    loadMessages(selectedIdRef.current);
    loadConversations();
  }, [loadConversations, loadMessages]);

  const selectConversation = useCallback((conversationId) => {
    selectedIdRef.current = conversationId;
    setSelectedId(conversationId);
    setDraft('');
    setSelectedFiles([]);
    setComposerError('');
    if (conversationId) {
      loadMessages(conversationId);
      loadConversations();
    } else {
      setThread(EMPTY_THREAD);
    }
  }, [loadConversations, loadMessages]);

  // Poll for new messages, and pick up writes from other tabs immediately
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);

    const handleStorage = (event) => {
      // Synthetic `storage` events dispatched inside the app carry no key
      const key = event.key || '';
      if (key === 'stellar_conversations' || key === 'stellar_users' || key.startsWith('stellar_messages_')) {
        refresh();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refresh]);

  // Jump to the latest message when a thread opens; follow new messages while near the bottom
  useEffect(() => {
    const list = messagesListRef.current;
    if (!list) return;

    const previous = lastScrollRef.current;
    const switched = previous.conversationId !== thread.conversationId;
    const grew = thread.messages.length > previous.count;
    const lastIsMine = thread.messages[thread.messages.length - 1]?.sender === currentUserEmail;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 320;

    if (switched || (grew && (lastIsMine || nearBottom))) {
      list.scrollTo({ top: list.scrollHeight, behavior: switched ? 'auto' : 'smooth' });
    }
    lastScrollRef.current = { conversationId: thread.conversationId, count: thread.messages.length };
  }, [thread, currentUserEmail]);

  // Auto-grow the composer up to a max height
  useLayoutEffect(() => {
    const input = messageInputRef.current;
    if (!input) return;
    input.style.height = 'auto';
    input.style.height = `${Math.min(input.scrollHeight, 140)}px`;
  }, [draft, selectedId]);

  // Escape closes the delete confirmation
  useEffect(() => {
    if (!pendingDeleteId) return undefined;
    const handleKey = (event) => {
      if (event.key === 'Escape') setPendingDeleteId(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [pendingDeleteId]);

  const selectedConversation = conversations.find(conv => conv.id === selectedId) || null;
  const totalUnread = conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);

  const visibleConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return conversations.filter(conv => {
      if (filter === 'unread' && conv.unreadCount === 0) return false;
      if (!term) return true;
      return [conv.otherName, conv.otherParticipant, conv.lastMessage, conv.childName]
        .some(value => value.toLowerCase().includes(term));
    });
  }, [conversations, searchTerm, filter]);

  const displayName = (conv) => conv?.otherName || conv?.otherParticipant || t.unknownUser;
  const roleLabel = (role) => (role === 'teacher' ? t.teacher : role === 'parent' ? t.parent : '');

  const formatClock = (timestamp) =>
    new Date(timestamp).toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' });

  const formatListTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    if (isSameDay(date, now)) return formatClock(timestamp);

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return t.yesterday;

    if (now - date < 6 * 24 * 60 * 60 * 1000) {
      return date.toLocaleDateString(locale, { weekday: 'short' });
    }
    return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
  };

  const formatDayLabel = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    if (isSameDay(date, now)) return t.today;

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (isSameDay(date, yesterday)) return t.yesterday;

    return date.toLocaleDateString(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric'
    });
  };

  const previewText = (conv) => {
    const body = conv.lastMessage || (conv.lastAttachmentCount > 0 ? `📎 ${t.attachment}` : '');
    if (!body) return t.noMessages;
    return conv.lastSender === currentUserEmail ? `${t.you}: ${body}` : body;
  };

  const canSend = !isSending && Boolean(selectedConversation) && (draft.trim() || selectedFiles.length > 0);

  const handleSendMessage = async () => {
    if (!canSend) return;

    setIsSending(true);
    setComposerError('');

    try {
      const attachments = await Promise.all(
        selectedFiles.map(async (file) => ({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: await readFileAsDataUrl(file)
        }))
      );

      const result = sendMessage(selectedConversation.id, currentUserEmail, draft, attachments);
      if (!result.success) throw new Error(result.error);

      setDraft('');
      setSelectedFiles([]);
      loadMessages(selectedConversation.id);
      loadConversations();

      if (navigator.vibrate) navigator.vibrate(50);
    } catch (error) {
      console.error('Error sending message:', error);
      setComposerError(t.sendFailed);
    } finally {
      setIsSending(false);
      messageInputRef.current?.focus();
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => file.size <= MAX_FILE_SIZE);

    setComposerError(validFiles.length < files.length ? t.fileTooLarge : '');
    setSelectedFiles(prev => [...prev, ...validFiles]);
    // Reset so picking the same file again still fires onChange
    event.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleConversationCreated = (conversationId) => {
    setSearchTerm('');
    setFilter('all');
    selectConversation(conversationId);
  };

  const confirmDelete = () => {
    if (!pendingDeleteId) return;
    deleteConversation(pendingDeleteId);
    if (selectedIdRef.current === pendingDeleteId) {
      selectConversation(null);
    }
    setPendingDeleteId(null);
    loadConversations();
  };

  // Keep the view pinned to the bottom while image attachments finish loading
  const handleImageLoad = () => {
    const list = messagesListRef.current;
    if (list && list.scrollHeight - list.scrollTop - list.clientHeight < 480) {
      list.scrollTop = list.scrollHeight;
    }
  };

  const threadMessages = thread.conversationId === selectedId ? thread.messages : [];
  const threadItems = [];
  threadMessages.forEach((msg, index) => {
    const prev = threadMessages[index - 1];
    const next = threadMessages[index + 1];
    const joins = (a, b) =>
      a && b && a.sender === b.sender && isSameDay(a.timestamp, b.timestamp) &&
      Math.abs(b.timestamp - a.timestamp) < GROUP_WINDOW_MS;

    if (!prev || !isSameDay(prev.timestamp, msg.timestamp)) {
      threadItems.push({ type: 'day', key: `day-${msg.timestamp}`, label: formatDayLabel(msg.timestamp) });
    }
    threadItems.push({
      type: 'message',
      key: `${msg.id}-${msg.sender}`,
      msg,
      joinsPrev: joins(prev, msg),
      joinsNext: joins(msg, next)
    });
  });

  const pendingDeleteConversation = conversations.find(conv => conv.id === pendingDeleteId);
  const listEmptyText = searchTerm.trim()
    ? t.noResults
    : filter === 'unread' ? t.noUnread : t.noConversations;

  return (
    <div className="teacher-parent-chat" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Top bar */}
      <header className="tpc-topbar">
        {onBack && (
          <button type="button" className="tpc-back-btn" onClick={onBack} aria-label={t.backHome}>
            <BackIcon size={18} strokeWidth={2.25} aria-hidden="true" />
            <span>{t.back}</span>
          </button>
        )}

        <div className="tpc-topbar-heading">
          <span className="tpc-topbar-icon" aria-hidden="true">
            <MessagesSquare size={22} strokeWidth={2} />
          </span>
          <div className="tpc-topbar-text">
            <h1 className="tpc-title">
              <span className="tpc-title-full">{t.title}</span>
              <span className="tpc-title-short">{t.shortTitle}</span>
            </h1>
            <p className="tpc-subtitle">
              {userRole === 'parent' ? t.subtitleParent : t.subtitleTeacher}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="tpc-primary-btn tpc-new-btn"
          onClick={() => setShowNewConversationModal(true)}
          aria-label={t.newConversation}
        >
          <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          <span className="tpc-new-btn-label">{t.newConversation}</span>
        </button>
      </header>

      <div className={`tpc-shell ${selectedConversation ? 'has-selection' : ''}`}>
        {/* Conversation list */}
        <aside className="tpc-sidebar" aria-label={t.conversations}>
          <div className="tpc-sidebar-top">
            <div className="tpc-sidebar-heading">
              <h2>{t.conversations}</h2>
            </div>

            <label className="tpc-search">
              <Search size={16} aria-hidden="true" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={t.searchPlaceholder}
                aria-label={t.searchPlaceholder}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="tpc-search-clear"
                  onClick={() => setSearchTerm('')}
                  aria-label={t.dismiss}
                >
                  <X size={14} aria-hidden="true" />
                </button>
              )}
            </label>

            <div className="tpc-tabs" role="tablist" aria-label={t.conversations}>
              {['all', 'unread'].map(key => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={filter === key}
                  className={`tpc-tab ${filter === key ? 'is-active' : ''}`}
                  onClick={() => setFilter(key)}
                >
                  {t[key]}
                  {key === 'unread' && totalUnread > 0 && <span className="tpc-tab-count">{totalUnread}</span>}
                </button>
              ))}
            </div>
          </div>

          <div className="tpc-conv-list">
            {visibleConversations.length === 0 ? (
              <div className="tpc-list-empty">
                <span className="tpc-list-empty-icon" aria-hidden="true">
                  {searchTerm.trim() ? <SearchX size={24} /> : <Inbox size={24} />}
                </span>
                <p>{listEmptyText}</p>
                {conversations.length === 0 && (
                  <button
                    type="button"
                    className="tpc-link-btn"
                    onClick={() => setShowNewConversationModal(true)}
                  >
                    <Plus size={16} aria-hidden="true" />
                    {t.startConversation}
                  </button>
                )}
              </div>
            ) : (
              visibleConversations.map(conv => (
                <button
                  key={conv.id}
                  type="button"
                  className={`tpc-conv ${conv.id === selectedId ? 'is-active' : ''} ${conv.unreadCount > 0 ? 'has-unread' : ''}`}
                  onClick={() => selectConversation(conv.id)}
                  aria-current={conv.id === selectedId ? 'true' : undefined}
                >
                  <span className="tpc-conv-inner">
                    <Avatar name={displayName(conv)} role={conv.otherRole} picture={conv.otherPicture} />
                    <span className="tpc-conv-body">
                      <span className="tpc-conv-row">
                        <span className="tpc-conv-name">{displayName(conv)}</span>
                        <span className="tpc-conv-time">{formatListTime(conv.lastMessageTime)}</span>
                      </span>
                      <span className="tpc-conv-row">
                        {roleLabel(conv.otherRole) && (
                          <span className={`tpc-role-dot tpc-role-dot--${roleKey(conv.otherRole)}`}>
                            {roleLabel(conv.otherRole)}
                          </span>
                        )}
                        <span className="tpc-conv-preview" dir="auto">{previewText(conv)}</span>
                        {conv.unreadCount > 0 && <span className="tpc-badge">{conv.unreadCount}</span>}
                      </span>
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Thread */}
        <section className="tpc-thread" aria-label={selectedConversation ? displayName(selectedConversation) : t.selectTitle}>
          {!selectedConversation ? (
            <div className="tpc-welcome">
              <div className="tpc-welcome-art" aria-hidden="true">
                <span className="tpc-welcome-bubble tpc-welcome-bubble--one" />
                <span className="tpc-welcome-bubble tpc-welcome-bubble--two" />
                <span className="tpc-welcome-core">
                  <MessagesSquare size={34} strokeWidth={1.75} />
                </span>
              </div>
              <h2>{conversations.length === 0 ? t.welcomeTitle : t.selectTitle}</h2>
              <p>{conversations.length === 0 ? t.welcomeBody : t.selectBody}</p>
              {conversations.length === 0 && (
                <button
                  type="button"
                  className="tpc-primary-btn"
                  onClick={() => setShowNewConversationModal(true)}
                >
                  <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
                  {t.startConversation}
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="tpc-thread-header">
                <button
                  type="button"
                  className="tpc-icon-btn tpc-thread-back"
                  onClick={() => selectConversation(null)}
                  aria-label={t.backToConversations}
                  title={t.backToConversations}
                >
                  <BackIcon size={20} aria-hidden="true" />
                </button>
                <Avatar
                  name={displayName(selectedConversation)}
                  role={selectedConversation.otherRole}
                  picture={selectedConversation.otherPicture}
                  size="lg"
                />
                <div className="tpc-thread-meta">
                  <h2 className="tpc-thread-name">{displayName(selectedConversation)}</h2>
                  <div className="tpc-thread-sub">
                    {roleLabel(selectedConversation.otherRole) && (
                      <span className={`tpc-role-chip tpc-role-chip--${roleKey(selectedConversation.otherRole)}`}>
                        {roleLabel(selectedConversation.otherRole)}
                      </span>
                    )}
                    {selectedConversation.otherName && (
                      <span className="tpc-thread-email">{selectedConversation.otherParticipant}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="tpc-icon-btn tpc-icon-btn--danger"
                  onClick={() => setPendingDeleteId(selectedConversation.id)}
                  aria-label={t.deleteConversation}
                  title={t.deleteConversation}
                >
                  <Trash2 size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="tpc-messages" ref={messagesListRef}>
                {threadItems.length === 0 ? (
                  <div className="tpc-thread-empty">
                    <span className="tpc-thread-empty-icon" aria-hidden="true">
                      <Inbox size={26} />
                    </span>
                    <p>{t.noMessages}</p>
                  </div>
                ) : (
                  threadItems.map(item => {
                    if (item.type === 'day') {
                      return (
                        <div key={item.key} className="tpc-day-divider" role="separator">
                          <span>{item.label}</span>
                        </div>
                      );
                    }

                    const { msg, joinsPrev, joinsNext } = item;
                    const mine = msg.sender === currentUserEmail;
                    const attachments = msg.attachments || [];

                    return (
                      <motion.div
                        key={item.key}
                        className={[
                          'tpc-msg',
                          mine ? 'tpc-msg--mine' : 'tpc-msg--theirs',
                          joinsPrev ? 'joins-prev' : '',
                          joinsNext ? 'joins-next' : ''
                        ].join(' ')}
                        initial={thread.initialIds.has(msg.id) ? false : { opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                      >
                        <div className="tpc-bubble">
                          {attachments.length > 0 && (
                            <div className="tpc-attachments">
                              {attachments.map((attachment, attIndex) =>
                                isImageAttachment(attachment) ? (
                                  <a
                                    key={attIndex}
                                    href={attachment.data}
                                    download={attachment.name}
                                    className="tpc-attachment-image"
                                    title={`${t.download} ${attachment.name}`}
                                  >
                                    <img src={attachment.data} alt={attachment.name} onLoad={handleImageLoad} />
                                  </a>
                                ) : (
                                  <a
                                    key={attIndex}
                                    href={attachment.data}
                                    download={attachment.name}
                                    className="tpc-attachment-file"
                                    title={`${t.download} ${attachment.name}`}
                                  >
                                    <span className="tpc-attachment-file-icon" aria-hidden="true">
                                      <FileText size={18} />
                                    </span>
                                    <span className="tpc-attachment-file-info">
                                      <span className="tpc-attachment-name">{attachment.name}</span>
                                      <span className="tpc-attachment-size">{formatFileSize(attachment.size)}</span>
                                    </span>
                                    <Download size={16} className="tpc-attachment-download" aria-hidden="true" />
                                  </a>
                                )
                              )}
                            </div>
                          )}
                          {msg.text && <p className="tpc-bubble-text" dir="auto">{msg.text}</p>}
                          <span className="tpc-bubble-meta">
                            <time dateTime={new Date(msg.timestamp).toISOString()}>{formatClock(msg.timestamp)}</time>
                            {mine && (
                              msg.read
                                ? <CheckCheck size={14} className="tpc-receipt is-read" aria-label={t.read} />
                                : <Check size={14} className="tpc-receipt" aria-label={t.sent} />
                            )}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              <div className="tpc-composer">
                {composerError && (
                  <div className="tpc-composer-error" role="alert">
                    <span>{composerError}</span>
                    <button
                      type="button"
                      className="tpc-composer-error-close"
                      onClick={() => setComposerError('')}
                      aria-label={t.dismiss}
                    >
                      <X size={14} aria-hidden="true" />
                    </button>
                  </div>
                )}

                {selectedFiles.length > 0 && (
                  <div className="tpc-file-chips">
                    {selectedFiles.map((file, index) => (
                      <span key={`${file.name}-${file.lastModified}-${index}`} className="tpc-file-chip">
                        <Paperclip size={14} aria-hidden="true" />
                        <span className="tpc-file-chip-name">{file.name}</span>
                        <span className="tpc-file-chip-size">{formatFileSize(file.size)}</span>
                        <button
                          type="button"
                          className="tpc-file-chip-remove"
                          onClick={() => removeFile(index)}
                          aria-label={`${t.removeFile} ${file.name}`}
                        >
                          <X size={12} aria-hidden="true" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="tpc-composer-box">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    accept="image/*,.pdf,.doc,.docx,.txt"
                  />
                  <button
                    type="button"
                    className="tpc-icon-btn tpc-attach-btn"
                    onClick={() => fileInputRef.current?.click()}
                    aria-label={t.attachFile}
                    title={t.attachFile}
                  >
                    <Paperclip size={20} aria-hidden="true" />
                  </button>
                  <textarea
                    ref={messageInputRef}
                    className="tpc-input"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t.typeMessage}
                    aria-label={t.typeMessage}
                    rows={1}
                  />
                  <button
                    type="button"
                    className="tpc-send-btn"
                    onClick={handleSendMessage}
                    disabled={!canSend}
                    aria-label={t.send}
                    title={t.send}
                  >
                    {isSending
                      ? <LoaderCircle size={20} className="tpc-spin" aria-hidden="true" />
                      : <SendHorizontal size={20} className="tpc-send-icon" aria-hidden="true" />}
                  </button>
                </div>
                <p className="tpc-composer-hint">{t.pressEnter}</p>
              </div>
            </>
          )}
        </section>
      </div>

      {/* Delete confirmation */}
      <AnimatePresence>
        {pendingDeleteConversation && (
          <motion.div
            className="tpc-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPendingDeleteId(null)}
          >
            <motion.div
              className="tpc-modal tpc-confirm"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="tpc-confirm-title"
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
            >
              <span className="tpc-confirm-icon" aria-hidden="true">
                <Trash2 size={22} />
              </span>
              <h2 id="tpc-confirm-title" className="tpc-confirm-title">{t.deleteTitle}</h2>
              <p className="tpc-confirm-text">{t.deleteBody(displayName(pendingDeleteConversation))}</p>
              <div className="tpc-confirm-actions">
                <button
                  type="button"
                  className="tpc-secondary-btn"
                  onClick={() => setPendingDeleteId(null)}
                  autoFocus
                >
                  {t.cancel}
                </button>
                <button type="button" className="tpc-danger-btn" onClick={confirmDelete}>
                  {t.delete}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        currentUserEmail={currentUserEmail}
        currentUserRole={userRole}
        language={language}
        onConversationCreated={handleConversationCreated}
      />
    </div>
  );
};

export default TeacherParentChat;
