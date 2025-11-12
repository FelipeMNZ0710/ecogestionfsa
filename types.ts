export type Page =
  | 'home'
  | 'como-reciclar'
  | 'puntos-verdes'
  | 'juegos'
  | 'noticias'
  | 'comunidad'
  | 'contacto'
  | 'perfil'
  | 'admin'
  | 'canjear'
  | 'notificaciones'
  | 'politica-privacidad'
  | 'terminos-uso'
  | 'politica-cookies'
  | 'sobre-nosotros';

// Structured Content Types for news articles
export interface TextBlock {
  id: string;
  type: 'text';
  text: string;
}

export interface ListBlock {
  id: string;
  type: 'list';
  items: string[];
}

export interface LinkBlock {
  id: string;
  type: 'link';
  url: string;
  title: string;
}

export interface VideoBlock {
  id: string;
  type: 'video';
  youtubeId: string;
  title: string;
}

export interface ImageBlock {
    id: string;
    type: 'image';
    base64Data?: string; 
    imageUrl?: string; 
    mimeType: string;
}

export interface FAQBlock {
  id: string;
  type: 'faq';
  questions: string[];
}

export type ContentBlock = TextBlock | ListBlock | LinkBlock | VideoBlock | ImageBlock | FAQBlock;

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockCondition: {
    type: 'points' | 'stat';
    stat?: keyof UserStats;
    value: number;
  };
}

export type Material = 'papel' | 'plastico' | 'vidrio' | 'metales' | 'organico';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number; // index of the correct option
}

export interface Quiz {
  points: number;
  questions: QuizQuestion[];
}

export interface MaterialContentItem {
    text: string;
    icon: string; // Emoji
}

export interface ProcessStep {
    step: number;
    title: string;
    description: string;
    icon: string;
}

export interface ImpactStat {
    stat: string;
    value: string;
    icon: string;
}

export interface MaterialContent {
    yes: MaterialContentItem[];
    no: MaterialContentItem[];
    tip: string;
    quiz: Quiz;
    commonMistakes: string[];
    recyclingProcess: ProcessStep[];
    impactStats: ImpactStat[];
}

export interface UserStats {
    messagesSent: number;
    pointsVisited: number;
    reportsMade: number;
    dailyLogins: number;
    completedQuizzes: Material[];
    quizzesCompleted: number;
    gamesPlayed: number;
    objectsIdentified: number;
}

export type UserRole = 'usuario' | 'moderador' | 'dueño';

export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  kgRecycled: number;
  role: UserRole;
  achievements: Achievement[];
  stats: UserStats;
  lastLogin: string; // ISO date string 'YYYY-MM-DD'
  favoriteLocations?: string[];
  // New fields for customization
  bannerUrl?: string;
  profilePictureUrl?: string;
  title?: string;
  bio?: string;
  socials?: {
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export type GamificationAction = 'send_message' | 'check_in' | 'report_punto_verde' | 'daily_login' | 'complete_quiz' | 'complete_game' | 'identify_object';

export interface Notification {
    id: number;
    type: 'points' | 'achievement';
    title: string;
    message: string;
    icon?: string;
}

// --- Puntos Verdes Types ---
export type LocationStatus = 'ok' | 'reported' | 'maintenance' | 'serviced';

export interface Schedule {
  days: number[]; // 0 for Sunday, 1 for Monday, etc.
  open: string; // "HH:MM"
  close: string; // "HH:MM"
}

export interface Location {
  id: string;
  name: string;
  address: string;
  hours: string; // Keep for display, but schedule is the source of truth
  schedule: Schedule[];
  materials: string[];
  mapData: {
    name: string;
    id: string;
    lat: number;
    lng: number;
    x: number;
    y: number;
  };
  status: LocationStatus;
  description: string;
  lastServiced: string; // ISO date string
  checkIns: number;
  imageUrls: string[];
  reportCount?: number;
  latestReportReason?: ReportReason;
  // FIX: Add optional distance property for sorting and display
  distance?: number;
}

export type ReportReason = 'full' | 'dirty' | 'damaged' | 'other';
export type ReportStatus = 'pending' | 'resolved' | 'dismissed';

export interface Report {
  id: number;
  locationName: string;
  userName: string;
  userEmail: string;
  reason: ReportReason;
  comment: string | null;
  imageUrl: string | null;
  status: ReportStatus;
  reported_at: string;
}


// --- Game Types ---
export type GameType = 
  | 'trivia' | 'memory' | 'sorting' | 'hangman' | 'chain' | 'catcher' | 'repair'
  | 'eco-quiz' | 'find-the-intruder' | 'recycling-path' | 'river-cleaner' | 'compost-sequence'
  | 'myth-busters' | 'concept-connector' | 'water-saver' | 'eco-wordle' | 'sustainable-builder'
  | 'energy-impact' | 'nature-sounds' | 'spot-the-difference';


export interface MemoryCardData {
  id: string;
  content: string; // Could be an emoji or an image URL
  type: 'icon' | 'image';
}

export type BinType = 'papel' | 'plastico' | 'vidrio' | 'metales' | 'organico';

export interface SortableItemData {
  id: string;
  name: string;
  image: string;
  correctBin: BinType;
}

export interface HangmanWord {
    word: string;
    hint: string;
}

export interface CatcherItem {
    id: string;
    image: string;
    type: 'recyclable' | 'trash';
    points: number;
}

export interface RepairableItem {
    id: string;
    name: string;
    image: string; // Emoji or URL
    toolOptions: string[]; // Emojis
    correctTool: string;
}

export interface Game {
    id: number;
    title: string;
    category: string;
    image: string;
    type: GameType;
    learningObjective: string;
    payload: {
        points: number; // EcoPoints for completion
        // For trivia
        questions?: QuizQuestion[];
        // For memory
        cards?: MemoryCardData[];
        // For sorting & chain
        items?: SortableItemData[];
        bins?: BinType[];
        duration?: number; // in seconds
        // For hangman
        words?: HangmanWord[];
        // For catcher
        fallingItems?: CatcherItem[];
        lives?: number;
        // For repair
        repairableItems?: RepairableItem[];
        timePerItem?: number;
    };
    rating?: number;
    userHighScore: number;
}

// --- News Types ---
export interface NewsArticle {
    id: number;
    image: string;
    category: string;
    title: string;
    date: string;
    excerpt: string;
    content: ContentBlock[];
    featured: boolean;
}

// --- Community Types ---
export interface Reaction {
  [emoji: string]: string[]; // emoji -> array of user names
}

export interface ReplyInfo {
  messageId: number;
  user: string;
  text: string;
}

export interface CommunityMessage {
    id: number;
    user_id: string;
    user: string;
    avatarUrl?: string;
    timestamp: Date;
    text: string;
    imageUrl?: string;
    edited?: boolean;
    reactions?: Reaction;
    replyingTo?: ReplyInfo;
    userRole?: UserRole;
    userTitle?: string;
}

// --- Chatbot Types ---
export interface ChatMessage {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  feedback?: 'like' | 'dislike' | null;
  isLoading?: boolean;
}

// --- Contact Message Type ---
export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'archived';
  submitted_at: string;
}

// --- Rewards Types ---
export type RewardCategory = 'Descuentos' | 'Digital' | 'Donaciones' | 'Productos';

export interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  category: RewardCategory;
  image: string;
  stock?: number; // Optional: for limited rewards
  fileName?: string;
  fileData?: string; // base64 encoded
}