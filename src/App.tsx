import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Building2, 
  Globe, 
  ArrowRight, 
  BookOpen, 
  Wind, 
  Heart, 
  Briefcase, 
  GraduationCap,
  Users,
  Ticket, 
  Mail, 
  Receipt, 
  Percent, 
  MapPin, 
  Activity,
  Phone, 
  Share2, 
  Rss, 
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  ShieldCheck,
  LogOut,
  X,
  Trash2,
  Clock
} from 'lucide-react';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  OperationType, 
  handleFirestoreError 
} from './lib/firebase';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  doc 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

const ADMIN_EMAIL = 'yesom6218@naver.com';

interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  message: string;
}

interface Submission {
  id: string;
  name: string;
  phone: string;
  email: string;
  message: string;
  createdAt: any;
  source: string;
}

interface ActivityItem {
  title: string;
  desc: string;
  images: string[];
}

interface ActivityCardProps {
  activity: ActivityItem;
  index: number;
}

const ActivityCard: React.FC<ActivityCardProps> = ({ activity, index }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (activity.images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % activity.images.length);
    }, 3000 + (index * 500)); // Stagger the start time slightly
    
    return () => clearInterval(interval);
  }, [activity.images.length, index]);

  return (
    <motion.div 
      className="group overflow-hidden rounded-[32px] bg-white transition-all hover:-translate-y-2 border border-stone-100 shadow-sm hover:shadow-xl duration-500"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <div className="p-3 pb-0 relative">
        <div className="aspect-[4/3] overflow-hidden rounded-[24px] relative">
          <AnimatePresence>
            <motion.img 
              key={currentImageIndex}
              className="absolute inset-0 w-full h-full object-cover" 
              src={activity.images[currentImageIndex]} 
              alt={activity.title}
              initial={{ opacity: 0, scale: 1.2 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ 
                duration: 1.5,
                ease: [0.33, 1, 0.68, 1] 
              }}
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          {/* Indicators */}
          {activity.images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 text-white">
              {activity.images.map((_, i) => (
                <div 
                  key={i} 
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-4' : 'bg-white/40'}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-6 pt-4">
        <h3 className="font-sans mb-2 text-2xl text-primary leading-tight font-bold">{activity.title}</h3>
        <p className="font-sans text-stone-800 text-sm md:text-base leading-relaxed font-medium">{activity.desc}</p>
      </div>
    </motion.div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTab, setAdminTab] = useState<'submissions' | 'gallery'>('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [galleryItems, setGalleryItems] = useState<any[]>([]);
  const [newGalleryItem, setNewGalleryItem] = useState({ title: '', url: '', description: '', linkUrl: '' });
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    phone: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAdmin(currentUser?.email === ADMIN_EMAIL && currentUser?.emailVerified);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      // 신청 현황 리스너
      const qSub = query(collection(db, 'contactRequests'), orderBy('createdAt', 'desc'));
      const unsubscribeSub = onSnapshot(qSub, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Submission[];
        setSubmissions(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'contactRequests');
      });

      // 갤러리 리스너
      const qGal = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const unsubscribeGal = onSnapshot(qGal, (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setGalleryItems(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'gallery');
      });

      return () => {
        unsubscribeSub();
        unsubscribeGal();
      };
    }
  }, [isAdmin]);

  const handleAddGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGalleryItem.title || !newGalleryItem.url) return;
    try {
      await addDoc(collection(db, 'gallery'), {
        ...newGalleryItem,
        createdAt: serverTimestamp()
      });
      setNewGalleryItem({ title: '', url: '', description: '', linkUrl: '' });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'gallery');
    }
  };

  const handleDeleteGalleryItem = async (id: string) => {
    if (!window.confirm('이미지를 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent, source: string = 'contact') => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      alert('성함과 연락처는 필수 항목입니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      await addDoc(collection(db, 'contactRequests'), {
        ...formData,
        source,
        createdAt: serverTimestamp()
      });
      setSubmitStatus('success');
      setFormData({ name: '', phone: '', email: '', message: '' });
      setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      setSubmitStatus('error');
      handleFirestoreError(error, OperationType.CREATE, 'contactRequests');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'contactRequests', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `contactRequests/${id}`);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-[#FDFCF0]/90 backdrop-blur-sm border-b border-stone-200/50">
        <div className="flex justify-between items-center w-full px-6 py-3 md:px-12 max-w-7xl mx-auto">
          <div className="text-xl font-bold text-[#1A237E]">
            <a href="/" className="flex items-center gap-3">
              <img 
                alt="울산국학원 로고" 
                className="h-9 w-auto" 
                src="https://postfiles.pstatic.net/MjAyNjA1MDZfMTUz/MDAxNzc4MDY0MjM2MzI2.sPH8cDTeHKDJVhL7S9Lzk57TPyfMAAbyPgE_jn9xESwg.Q6Tt74BNvfpq8fXbf_3Phi_keE6v_T_fXXUMNLFeLIgg.PNG/%EB%A1%9C%EA%B3%A0-%EC%82%BC%EC%A1%B1%EC%98%A4-removebg-preview.png?type=w3840"
                referrerPolicy="no-referrer"
              />
              <span className="font-sans font-bold tracking-tight">울산국학원</span>
            </a>
          </div>
          
          <div className="hidden lg:flex gap-x-8 items-center">
            {['소개', '주요활동', '갤러리', '활동후기', '프로그램', '강사진', '후원', '협력단체', '문의하기'].map((item) => (
              <a 
                key={item}
                href={`#${item}`} 
                className="text-stone-700 font-bold hover:text-[#1A237E] transition-colors text-base"
              >
                {item}
              </a>
            ))}
            {isAdmin && (
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="flex items-center gap-2 text-secondary font-bold text-base hover:text-primary transition-colors"
                title="관리자 패널"
              >
                <ShieldCheck className="w-5 h-5" />
                관리자
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-xs text-stone-500 font-medium">{user.displayName || user.email}</span>
                <button 
                  onClick={() => logout()}
                  className="text-stone-400 hover:text-red-500 transition-colors"
                  title="로그아웃"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => loginWithGoogle()}
                className="hidden sm:block text-xs font-bold text-stone-500 hover:text-primary transition-colors"
              >
                관리자 로그인
              </button>
            )}
            <a 
              href="https://www.kookhakwon.org/Support/Support.aspx?supportType=1"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#1a237e] text-white px-6 py-2 rounded-full font-sans font-semibold text-base hover:opacity-80 transition-opacity active:scale-95 inline-block text-center"
            >
              후원하기
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            alt="Hero Background" 
            className="w-full h-full object-cover brightness-105" 
            src="https://postfiles.pstatic.net/MjAyNjA1MDFfMTE1/MDAxNzc3NjM2Mjg0OTYy.eRB9PHl3nGLt_fVtOTFa6Em9Ud6INPdO6EZQPGmjzhcg.lO7npRd3gMpNnxjTfJLPZgFV5uI3lvK4Nr_ZZn9hZIkg.PNG/Gemini_Generated_Image_tp5evatp5evatp5e.png?type=w3840"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10"></div>
          <p className="absolute bottom-16 left-8 md:left-16 text-[10px] text-stone-500/40 font-sans tracking-tighter select-none">
            이 이미지는 AI로 구성한 것입니다
          </p>
        </div>

        <div className="relative z-10 w-full max-w-7xl lg:max-w-[1440px] mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 items-center gap-12 pt-10">
          <motion.div 
            className="text-left space-y-6 md:space-y-8"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <h1 className="text-[#1A237E] leading-[1.1] text-[50px] font-bold w-fit lg:w-[750px] max-w-full">
              대한민국의<br/>
              <span className="text-[#FF3B30]">뿌리정신과 문화</span>를 살리고<br/>
              미래 가치로 확장시키는<br/>
              울산국학원
            </h1>
            <p className="text-stone-800 max-w-2xl font-sans leading-relaxed text-[20px] font-bold">
              홍익정신을 바탕으로 인성교육과 전통문화를 보급하여<br/>
              더 나은 사회, 더 나은 미래를 만들어갑니다.
            </p>
            <p className="text-on-surface-variant font-sans leading-relaxed text-xs opacity-50 lg:max-w-xs pt-2">
              이 이미지는 AI로 구성한 것입니다.
            </p>
          </motion.div>

          <motion.div 
            className="hidden md:flex justify-end items-center"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <p className="text-on-surface leading-[1.4] text-right text-[24px] md:text-[28px] font-sans font-medium">
              전통을 품고, 오늘을 가꾸며,<br/>
              미래를 열어갑니다.
            </p>
          </motion.div>
        </div>


      </header>

      {/* About Section */}
      <section className="py-10 md:py-14 px-6 max-w-7xl mx-auto font-sans" id="소개">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div className="space-y-4" {...fadeInUp}>
            <h2 className="font-sans text-[40px] text-on-surface font-bold">울산국학원 소개</h2>
            <p className="font-sans text-on-surface-variant leading-relaxed text-lg md:text-xl font-medium">
              울산국학원은 한민족의 고유한 정신인 홍익인간 정신을 계승하고, 현대적으로 재해석하여 지역 사회에 전파하는 문화 교육 기관입니다. 
              우리는 잃어버린 민족의 혼을 되찾고, 모두가 행복한 세상을 만드는 인성 회복 운동에 앞장섭니다.
            </p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {[
              { icon: Brain, title: "인성", desc: "자신을 사랑하고 타인을 배려하는 참된 마음" },
              { icon: Building2, title: "전통", desc: "고유한 역사와 문화의 뿌리를 지키는 힘" },
              { icon: Globe, title: "홍익정신", desc: "널리 사람을 이롭게 하는 공생의 가치" },
            ].map((feature, i) => (
              <motion.div 
                key={feature.title}
                className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30 flex flex-col items-center text-center group hover:bg-white transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <feature.icon className="text-secondary w-14 h-14 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-sans mb-2 text-2xl font-bold">{feature.title}</h3>
                <p className="text-sm font-sans text-on-surface-variant">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Activity Section */}
      <section className="bg-[#f5f2e9] py-10 md:py-14 overflow-hidden" id="주요활동">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="text-center">
            <h2 className="font-sans text-primary text-[32px] md:text-[40px] font-bold">주요 활동</h2>
            <p className="font-sans text-on-surface-variant mt-2 text-lg">울산국학원의 다채로운 활동을 확인해보세요.</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {([
              { 
                title: "인성 교육 프로그램", 
                desc: "청소년과 성인을 대상으로 인성 교육 강좌를 운영합니다.",
                images: [
                  "https://postfiles.pstatic.net/MjAyNjA1MTVfNTEg/MDAxNzc4ODQ3MTE2NjIy.3CMsc4bk0FRAWFI9hreEzv6_KSw1WSJkCbFJwNYy4iUg.d6YsQVcPS5O6ym2Os8Xin2XEJAG5mL9-JihGL2Dm8JEg.JPEG/KakaoTalk_20221226_112111207_10.jpg?type=w3840",
                  "https://postfiles.pstatic.net/MjAyNjA1MTVfMTkw/MDAxNzc4ODQ3MTU4ODM0.4GWEOmt5lI-fpcRYudXCO_IOgpVreq6U22cSLr8j1mUg.rOVlex3-hekwA8tcki2QxAdmZCd82z7pVsE8BgYSLoUg.JPEG/KakaoTalk_20230519_184229518_08.jpg?type=w3840"
                ]
              },
              { 
                title: "힐링 명상 체험 교실", 
                desc: "현대인의 스트레스를 해소하는 명상 체험 과정입니다.",
                images: [
                  "https://postfiles.pstatic.net/MjAyNjA1MTVfMjgy/MDAxNzc4ODUzMzEzNDM1.d_paPjfeLbpO950DzAYXD_5R8r5HdTYIlHvTb0aGib0g.4iRM5js7L6-R-vYTKwpkdsZ5F7etB6wz9Cw-ulMf2AEg.JPEG/Gemini_Generated_Image_hqtx3shqtx3shqtx.jpg?type=w3840",
                  "https://postfiles.pstatic.net/MjAyNjA1MTVfMjkz/MDAxNzc4ODUzMzE4NzMw.rpfDFntAXq3a_yMnonmqPqTesX9ET1NNJ0cmWfljYXYg.tcABA0cTRPlfhGmbEnU1fJ1PQF2Ayi8QkS7dghBIIL8g.JPEG/Gemini_Generated_Image_hqtx3shqtx3shqtx1.jpg?type=w3840"
                ]
              },
              { 
                title: "문화 행사", 
                desc: "지역 사회의 화합을 위한 다채로운 행사를 개최합니다.",
                images: [
                  "https://postfiles.pstatic.net/MjAyNjA1MTVfNjcg/MDAxNzc4ODUyODYxNjM5.eV5xsCJJ6dQnGbDGdlb8Qq3Q40V2jx1lEECCF083O9Yg.e09knTWp14ATvkByNBYXXmUwvLBNl-jJPghDfJo3kwMg.JPEG/IMG_2546.JPG?type=w3840",
                  "https://postfiles.pstatic.net/MjAyNjA1MTVfODYg/MDAxNzc4ODUyNzYyMDA5.AwijbO2fZ12M231JWDKU0i2TiHW-fKuCi_cwK1U8OTAg.SfrhIiDfH81ydouR0cLqng26SB5uGdiZlmMPQ0gKVewg.JPEG/IMG_5917_-_%EB%B3%B5%EC%82%AC%EB%B3%B8.JPG?type=w3840"
                ]
              },
              { 
                title: "국학 민족혼 교육", 
                desc: "한민족의 건국 이념을 배우고 익히는 교육 프로그램입니다.",
                images: [
                  "https://postfiles.pstatic.net/MjAyNjA1MTVfMTk5/MDAxNzc4ODQ3NzA3NDAw.VFdNMi9upIeCCcRCUV4cykKZ3dcfaDQcqB53yiAysV0g.ATDsH2cJ5qv8VqXhRT9S-puS3bb3rT303rpwxUYHjfcg.PNG/Gemini_Generated_Image_dy8tgady8tgady8t.png?type=w3840",
                  "https://postfiles.pstatic.net/MjAyNjA1MTVfMTk4/MDAxNzc4ODUxMTQ2ODE4.j9G_xi0mNS0Wf6XVIVu70SPiyxceq_tD7kmbflmMOOIg.DpRGKrVfksjQL2EYBz_Ydn6YI1xbmVV_JKq7S3WAcGAg.PNG/Capture_2026_0515_210552.png?type=w3840"
                ]
              }
            ] as ActivityItem[]).map((activity, i) => (
              <ActivityCard key={i} activity={activity} index={i} />
            ))}
          </div>
        </div>
      </section>


      {/* Gallery Section */}
      <section className="bg-white py-10 md:py-14 overflow-hidden" id="갤러리">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="text-center">
            <h2 className="font-sans text-[#1A237E] text-[32px] md:text-[40px] font-bold">활동 갤러리</h2>
            <p className="font-sans text-stone-700 mt-2 text-lg md:text-xl font-medium">울산국학원의 생생한 활동 현장을 전해드립니다.</p>
          </div>
        </div>
        
        <div className="w-full overflow-hidden py-10 relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
          
          <motion.div 
            className="flex gap-8 px-4"
            animate={{ x: ["0%", "-100%"] }}
            transition={{
              duration: 250, // Even slower speed
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ width: "fit-content" }}
          >
            {/* Double the items for seamless loop */}
            {[...(galleryItems.length > 0 ? galleryItems : [
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTVfNzIg/MDAxNzc4ODU1NjEyNjU3.JNF1JDDtIsxhX0i92nGhyzxEucVZ2SEyeXw6BeW52eEg.jDHOWpcHioxbHo5Nf9GDH8pjLXWCdCEjjbGwmDUMXJ8g.JPEG/20240619_095052.jpg?type=w3840",
                title: "인성 교육 현장",
                description: "청소년들을 위한 올바른 가치관 정립과 인성 함양 교육이 진행되는 모습입니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTVfNjEg/MDAxNzc4ODU1MjI1MDQz.5KiGgHAb8JR6o10Yih69a8tQ43lMbvBv8wYbhn6ErjMg.TIKadu3ZYumd7oDLGCxvAKntdu_49GQDTUOvsYKXSRgg.JPEG/84910_106611_437.jpg?type=w3840",
                title: "힐링 명상 체험 교실",
                description: "심신의 안정과 집중력을 높여주는 체계적인 명상 프로그램이 운영됩니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTdfNjEg/MDAxNzc4OTk4NTI0OTMy.s4D3kNfdaDMZWs7g63J1-sGYcnbLo5niOnEX02ccCoEg.mg5O5XZ9sb-3QtZHHPm-ZW6WcpiFWGTWUKXZDU_B4jcg.JPEG/KakaoTalk_20231003_174549214_01.jpg?type=w3840",
                title: "지역 문화 행사",
                description: "지역 사회와 소통하며 전통 문화의 가치를 나누는 다채로운 축제의 장입니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTVfMTk5/MDAxNzc4ODQ3NzA3NDAw.VFdNMi9upIeCCcRCUV4cykKZ3dcfaDQcqB53yiAysV0g.ATDsH2cJ5qv8VqXhRT9S-puS3bb3rT303rpwxUYHjfcg.PNG/Gemini_Generated_Image_dy8tgady8tgady8t.png?type=w3840",
                title: "국학 민족혼 교육",
                description: "한민족의 건국 이념과 고유한 역사 정신을 바로 세우는 교육 현장입니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTdfNDUg/MDAxNzc4OTk5MTcxNzk0.Az1HCxOG1q6j48Rhz-gofvWYTe0QgptriFU9QFyH-c0g.lVX-fAbqyZ6LE5ilyMTUlXTiWByCxjNGVD0l4KwfOy8g.PNG/ChatGPT_Image_2026%EB%85%84_5%EC%9B%94_17%EC%9D%BC_%EC%98%A4%ED%9B%84_03_25_33.png?type=w3840",
                title: "국학기공 체험",
                description: "몸과 마음의 조화를 통해 건강한 에너지를 채우는 체험 과정입니다.",
                objectFit: "contain" as const
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTVfMTAw/MDAxNzc4ODU3MDA2Mzc1.idhOkY69AL0SppiVfA7t8-OMfCutEJskd5w7cq1ta3kg.R-qBjkVMl-82MEcloCKF0TLH6iQrCGsGUF8-jgaXjcsg.JPEG/IMG_6018.JPG?type=w3840",
                title: "학술 포럼",
                description: "아름다운 고유 문화를 널리 알리고 직접 체험해보는 소중한 시간입니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840",
                title: "행복한 도전 이야기",
                description: "울산국학원의 생생한 활동 발자취를 기록한 소중한 모습들입니다."
              }
            ]), ...(galleryItems.length > 0 ? galleryItems : [
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTVfNzIg/MDAxNzc4ODU1NjEyNjU3.JNF1JDDtIsxhX0i92nGhyzxEucVZ2SEyeXw6BeW52eEg.jDHOWpcHioxbHo5Nf9GDH8pjLXWCdCEjjbGwmDUMXJ8g.JPEG/20240619_095052.jpg?type=w3840",
                title: "인성 교육 현장",
                description: "청소년들을 위한 올바른 가치관 정립과 인성 함양 교육이 진행되는 모습입니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTVfNjEg/MDAxNzc4ODU1MjI1MDQz.5KiGgHAb8JR6o10Yih69a8tQ43lMbvBv8wYbhn6ErjMg.TIKadu3ZYumd7oDLGCxvAKntdu_49GQDTUOvsYKXSRgg.JPEG/84910_106611_437.jpg?type=w3840",
                title: "힐링 명상 체험 교실",
                description: "심신의 안정과 집중력을 높여주는 체계적인 명상 프로그램이 운영됩니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTdfNjEg/MDAxNzc4OTk4NTI0OTMy.s4D3kNfdaDMZWs7g63J1-sGYcnbLo5niOnEX02ccCoEg.mg5O5XZ9sb-3QtZHHPm-ZW6WcpiFWGTWUKXZDU_B4jcg.JPEG/KakaoTalk_20231003_174549214_01.jpg?type=w3840",
                title: "지역 문화 행사",
                description: "지역 사회와 소통하며 전통 문화의 가치를 나누는 다채로운 축제의 장입니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTVfMTk5/MDAxNzc4ODQ3NzA3NDAw.VFdNMi9upIeCCcRCUV4cykKZ3dcfaDQcqB53yiAysV0g.ATDsH2cJ5qv8VqXhRT9S-puS3bb3rT303rpwxUYHjfcg.PNG/Gemini_Generated_Image_dy8tgady8tgady8t.png?type=w3840",
                title: "국학 민족혼 교육",
                description: "한민족의 건국 이념과 고유한 역사 정신을 바로 세우는 교육 현장입니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTdfNDUg/MDAxNzc4OTk5MTcxNzk0.Az1HCxOG1q6j48Rhz-gofvWYTe0QgptriFU9QFyH-c0g.lVX-fAbqyZ6LE5ilyMTUlXTiWByCxjNGVD0l4KwfOy8g.PNG/ChatGPT_Image_2026%EB%85%84_5%EC%9B%94_17%EC%9D%BC_%EC%98%A4%ED%9B%84_03_25_33.png?type=w3840",
                title: "국학기공 체험",
                description: "몸과 마음의 조화를 통해 건강한 에너지를 채우는 체험 과정입니다.",
                objectFit: "contain" as const
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTVfMTAw/MDAxNzc4ODU3MDA2Mzc1.idhOkY69AL0SppiVfA7t8-OMfCutEJskd5w7cq1ta3kg.R-qBjkVMl-82MEcloCKF0TLH6iQrCGsGUF8-jgaXjcsg.JPEG/IMG_6018.JPG?type=w3840",
                title: "학술 포럼",
                description: "아름다운 고유 문화를 널리 알리고 직접 체험해보는 소중한 시간입니다."
              },
              { 
                url: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840",
                title: "행복한 도전 이야기",
                description: "울산국학원의 생생한 활동 발자취를 기록한 소중한 모습들입니다."
              }
            ])].map((item: { url: string; title: string; description: string; objectFit?: "contain" | "cover"; linkUrl?: string }, i) => (
              <div 
                key={i}
                className="flex flex-col bg-white rounded-[32px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 group border border-stone-100 w-[350px] shrink-0"
              >
                <div className="p-3 pb-0 relative">
                  <div className="aspect-[4/3] overflow-hidden rounded-[24px] bg-stone-50">
                    <img 
                      alt={item.title} 
                      className={`w-full h-full ${item.objectFit === 'contain' ? 'object-contain p-4' : 'object-cover'} transition-transform duration-700 group-hover:scale-105`} 
                      src={item.url}
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  {item.linkUrl && (
                    <a 
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-3 rounded-[24px] bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center"
                    >
                      <div className="w-12 h-12 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all transform scale-90 group-hover:scale-100">
                        <ArrowRight className="w-6 h-6 text-[#1A237E]" />
                      </div>
                    </a>
                  )}
                </div>
                <div className="p-8 pt-6">
                  <h3 className="font-sans text-2xl mb-3 text-[#1A237E] leading-tight font-bold truncate">{item.title}</h3>
                  <p className="font-sans text-stone-800 text-sm leading-relaxed font-medium line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-10 md:py-14 bg-[#006F74] overflow-hidden" id="활동후기">
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="text-center">
            <h2 className="font-sans text-[32px] md:text-[40px] text-white font-bold">활동 후기</h2>
            <p className="font-sans mt-2 text-lg md:text-xl text-[#FDFCF0]">울산국학원과 함께한 소중한 변화의 기록입니다.</p>
          </div>
        </div>

        <div className="w-full overflow-hidden py-10 relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#006F74] to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#006F74] to-transparent z-10"></div>
          
          <motion.div 
            className="flex gap-8 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 80, // Slow speed
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ width: "fit-content" }}
          >
            {/* Double the items for seamless loop */}
            {[...[
              {
                text: '"울산국학원 인성 교육을 통해 나 자신을 돌아보는 소중한 시간을 가졌습니다. 일상의 스트레스에서 벗어나 참된 평온을 찾을 수 있게 되어 정말 감사합니다."',
                author: "김*현 님",
                tag: "인성 교육"
              },
              {
                text: '"청소년 리더십캠프에 참여한 아이가 예전보다 훨씬 예의 바르고 배려심 깊은 모습으로 변했습니다. 올바른 가치관을 심어주셔서 감사합니다."',
                author: "이*민 님",
                tag: "청소년 교실"
              },
              {
                text: '"힐링 명상반을 다니면서 몸과 마음이 모두 건강해졌습니다. 매일 아침이 활기차고 긍정적인 에너지로 가득 찹니다."',
                author: "박*우 님",
                tag: "힐링명상"
              },
              {
                text: '"우리 민족의 찬란한 역사와 정신을 제대로 배우게 되었습니다. 이제는 한국인으로서의 자긍심을 가지고 당당하게 말할 수 있습니다."',
                author: "최*준 님",
                tag: "역사문화"
              },
              {
                text: '"울산국학원의 폭력예방 수업을 듣고 소통과 배려의 중요성을 깊이 깨달았습니다. 서로를 존중하는 마음이 얼마나 큰 변화를 만드는지 실감했습니다."',
                author: "백*초",
                tag: "폭력예방"
              },
              {
                text: '"해피스쿨 교육을 통해 나 자신과 타인, 그리고 지구를 사랑하는 법을 배웠습니다. 모두가 함께 행복한 세상을 만드는 홍익의 꿈을 응원합니다."',
                author: "김*아 님",
                tag: "해피스쿨"
              }
            ], ...[
              {
                text: '"울산국학원 인성 교육을 통해 나 자신을 돌아보는 소중한 시간을 가졌습니다. 일상의 스트레스에서 벗어나 참된 평온을 찾을 수 있게 되어 정말 감사합니다."',
                author: "김*현 님",
                tag: "인성 교육"
              },
              {
                text: '"청소년 리더십캠프에 참여한 아이가 예전보다 훨씬 예의 바르고 배려심 깊은 모습으로 변했습니다. 올바른 가치관을 심어주셔서 감사합니다."',
                author: "이*민 님",
                tag: "청소년 교실"
              },
              {
                text: '"힐링 명상반을 다니면서 몸과 마음이 모두 건강해졌습니다. 매일 아침이 활기차고 긍정적인 에너지로 가득 찹니다."',
                author: "박*우 님",
                tag: "힐링명상"
              },
              {
                text: '"우리 민족의 찬란한 역사와 정신을 제대로 배우게 되었습니다. 이제는 한국인으로서의 자긍심을 가지고 당당하게 말할 수 있습니다."',
                author: "최*준 님",
                tag: "역사문화"
              },
              {
                text: '"울산국학원의 폭력예방 수업을 듣고 소통과 배려의 중요성을 깊이 깨달았습니다. 서로를 존중하는 마음이 얼마나 큰 변화를 만드는지 실감했습니다."',
                author: "백*초",
                tag: "폭력예방"
              },
              {
                text: '"해피스쿨 교육을 통해 나 자신과 타인, 그리고 지구를 사랑하는 법을 배웠습니다. 모두가 함께 행복한 세상을 만드는 홍익의 꿈을 응원합니다."',
                author: "김*아 님",
                tag: "해피스쿨"
              }
            ]].map((review, i) => (
              <div 
                key={i}
                className="p-8 md:p-10 rounded-3xl flex flex-col bg-white shadow-lg w-[400px] shrink-0 border border-stone-100"
              >
                <div className="mb-4">
                  <span className="px-3 py-1 bg-[#006F74]/10 text-[#006F74] text-xs md:text-sm rounded-full font-bold">
                    {review.tag}
                  </span>
                </div>
                <p className="font-sans text-stone-800 flex-grow leading-relaxed mb-6 text-base md:text-lg italic font-medium">
                  {review.text}
                </p>
                <div className="flex items-center justify-between border-t border-stone-100 pt-6">
                  <span className="font-sans font-bold text-stone-900 text-base">{review.author}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Activity key={star} className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Program Section */}
      <section className="py-10 md:py-14 bg-stone-50" id="프로그램">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="font-sans text-[#1A237E] text-[32px] md:text-[40px] font-bold">프로그램</h2>
            <p className="font-sans text-stone-700 mt-2 text-base md:text-lg font-medium">울산국학원에서 운영하는 다양한 교육 프로그램을 소개합니다.</p>
          </div>
          
        <div className="w-full overflow-hidden py-10 relative">
          
          <motion.div 
            className="flex gap-8 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 80, // Slow speed
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ width: "fit-content" }}
          >
            {[...[
              {
                icon: BookOpen,
                title: "2026년 울산경찰서 사랑의 교실",
                info: "일정: 매월 1회 또는 2회 | 장소: 울산국학원 교육장",
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjcy/MDAxNzc4ODU3NzU0MTY1.Se5OKDCAueoqd208KkBjyAlnIedw1pPRdBnMiionxXYg.RbItIlm5D60xdkFM5VN9hw0Qe4KhiisGKg2HzvndNNcg.JPEG/%EC%82%AC%EB%9E%91%EC%9D%98%EA%B5%90%EC%8B%A4.jpg?type=w773",
                objectFit: "contain" as const
              },
              {
                icon: Wind,
                title: "국학회원을 위한 국학힐링명상 체험반",
                info: "일정: 매주 수요일 오전 10시 | 장소: 온라인 또는 교육장",
                image: "https://postfiles.pstatic.net/MjAyNjA1MTVfMjkz/MDAxNzc4ODUzMzE4NzMw.rpfDFntAXq3a_yMnonmqPqTesX9ET1NNJ0cmWfljYXYg.tcABA0cTRPlfhGmbEnU1fJ1PQF2Ayi8QkS7dghBIIL8g.JPEG/Gemini_Generated_Image_hqtx3shqtx3shqtx1.jpg?type=w3840",
                objectFit: "contain" as const
              },
              {
                icon: Briefcase,
                title: "민족혼 및 뿌리 정신 교육",
                info: "일정: 수시 운영 | 장소: 협약 기업 및 단체",
                image: "https://postfiles.pstatic.net/MjAyNjA1MTdfNjEg/MDAxNzc5MDAxMDYwOTY1.2ltbHCD9vMZACqm0kgybxUzN0JP49h_re_QMPeWBAKwg.EwGUR9B-CL_goV_N25ZLz8OL5I5iQ6EcXRc1bFuCCCwg.PNG/KakaoTalk_20260506_101350971.png?type=w3840",
                objectFit: "contain" as const
              },
              {
                icon: Heart,
                title: "역사문화와 K스피릿 강좌",
                info: "일정: 수시 운영 | 장소: 단체 및 기업, 울산국학원",
                image: "https://postfiles.pstatic.net/MjAyNjA1MTdfMjA0/MDAxNzc4OTk5ODM1MTY1.7egSk3R_dyWlfx1ZmPNCG1gywM-ZTYm_3Wve4OALv74g.cga6Kjus6k5NTdvj0SQbViYJP4u48Vau3F2t5mNVdXIg.PNG/ChatGPT_Image_2026%EB%85%84_5%EC%9B%94_17%EC%9D%BC_%EC%98%A4%ED%9B%84_03_36_03.png?type=w3840",
                objectFit: "contain" as const
              },
              {
                icon: GraduationCap,
                title: "청소년 인성교육 및 K리더스캠프",
                info: "일정: 수시 운영 | 장소: 울산 관내 학교 및 교육장",
                image: "https://postfiles.pstatic.net/MjAyNjA1MTdfMjU2/MDAxNzc5MDAyMzEzOTIz.kQ-wfTQ4H9gUwLAY2KFe_rcuAFWmN0B_J_ShseahtOEg.uGJKyz0KbBzqhNpjq-YWjTNhEsnalFridy3IOtnXqKMg.PNG/Capture_2026_0517_161351.png?type=w3840",
                objectFit: "contain" as const
              }
            ]].map((program, i) => (
              <div 
                key={i}
                className="group flex flex-col bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100 w-[320px] shrink-0"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-stone-50">
                  <img 
                    src={program.image}
                    alt={program.title}
                    className={`w-full h-full ${program.objectFit === 'contain' ? 'object-contain p-2' : 'object-cover'} transition-transform duration-700 group-hover:scale-105`}
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm">
                    <program.icon className="w-5 h-5 text-secondary" />
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                  <h3 className="font-sans text-base text-[#1A237E] mb-3 leading-tight group-hover:text-primary transition-colors font-bold truncate">{program.title}</h3>
                  <div className="mt-auto pt-4 border-t border-stone-100">
                    <p className="font-sans text-stone-800 text-xs leading-relaxed whitespace-pre-line font-medium line-clamp-2">
                      {program.info.split(' | ').join('\n')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
        </div>
      </section>

      {/* Instructors Section */}
      <section className="py-10 md:py-14 bg-white" id="강사진">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="font-sans text-primary text-[32px] md:text-[40px] font-bold">강사진 소개</h2>
            <p className="font-sans text-on-surface-variant mt-2 text-lg md:text-xl">울산국학원의 전문 강사진입니다.</p>
          </div>
        </div>

        <div className="w-full overflow-hidden py-10">
          <motion.div 
            className="flex gap-12 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 150, // Very slow speed
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ width: "fit-content" }}
          >
            {[...[
              { 
                name: "강** 원장", 
                role: "울산국학원 원장 / 인성교육 전문가", 
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840"
              },
              { 
                name: "이** 수석강사", 
                role: "국학기공 마스터 / 명상 지도자", 
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840" 
              },
              { 
                name: "박** 책임연구원", 
                role: "전통문화 학술 연구 / 청소년 교육", 
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840"
              },
              { 
                name: "최** 전문교수", 
                role: "힐링명상교육/브레인코치", 
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840"
              }
            ], ...[
              { 
                name: "강** 원장", 
                role: "울산국학원 원장 / 인성교육 전문가", 
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840"
              },
              { 
                name: "이** 수석강사", 
                role: "국학기공 마스터 / 명상 지도자", 
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840" 
              },
              { 
                name: "박** 책임연구원", 
                role: "전통문화 학술 연구 / 청소년 교육", 
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840"
              },
              { 
                name: "최** 전문교수", 
                role: "힐링명상교육/브레인코치", 
                image: "https://postfiles.pstatic.net/MjAyNjA1MTZfMjQ0/MDAxNzc4ODU3NTE3MTM4.2Gf8mUG20qurAmB9liU1-AjzpIIj8towVbXH_aTFUc4g.sHcABdsgo3sa8dbOCuiCVOuo7goIIdBC-0c8zUkbIAcg.PNG/Gemini_Generated_Image_mi4b9emi4b9emi4b.png?type=w3840"
              }
            ]].map((instructor, i) => (
              <div 
                key={i}
                className="group flex flex-col items-center w-[220px] shrink-0"
              >
                <div className="relative aspect-[3/4] w-full mx-auto overflow-hidden rounded-2xl mb-6 shadow-md transition-all duration-500 group-hover:shadow-2xl ring-1 ring-stone-100 group-hover:ring-primary/20">
                  <motion.img 
                    src={instructor.image} 
                    alt={instructor.name} 
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.8 }}
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h3 className="font-sans text-xl mb-1 group-hover:text-primary transition-colors duration-300 font-bold">{instructor.name}</h3>
                <p className="font-sans text-xs text-secondary font-bold uppercase tracking-wider text-center group-hover:text-primary/70 transition-colors duration-300">{instructor.role}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Sponsor Section */}
      <section className="py-10 md:py-14 bg-[#f5f2e9]" id="후원">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="font-sans text-[#1A237E] text-[32px] md:text-[40px] font-bold">후원감사카드</h2>
            <p className="font-sans text-stone-500 mt-2 text-[20px] text-balance">울산국학원과 고귀한 뜻을 함께해주시는 소중한 분들께 마음을 전합니다.</p>
          </div>
          
          <div className="w-full overflow-hidden py-10 relative">
            <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#f5f2e9] to-transparent z-10"></div>
            <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#f5f2e9] to-transparent z-10"></div>
            
            <motion.div 
              className="flex gap-12 px-4"
              animate={{ x: ["0%", "-50%"] }}
              transition={{
                duration: 250, // Very slow speed
                ease: "linear",
                repeat: Infinity,
              }}
              style={{ width: "fit-content" }}
            >
              {[...[
                { name: "1주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDNfMjA4/MDAxNzc3ODA1MTUwODI5.06cxf7wJT0HnpIQuO2PrNsNU2hFukBWAvYLdVA-i71cg.aCc6P5LHTHe3CKPahl7EHu5I0qOapmlcr4vnG-x1J9og.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-1%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279372790" },
                { name: "2주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDNfMjE5/MDAxNzc3ODA1MTUyNDgx.iRiyJSUDN6ZC3PletlU5Gpw94e2WbuOzqqMNJHquh7Eg.Am2LpIqmFSFMTDICR6oZzEChogzb1IjSNv24wWTUN94g.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-2%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279364592" },
                { name: "3주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDNfMTYw/MDAxNzc3ODA1MTUyMzA4.fb6jFHGsbCMjkCo7MrvJMLzeeXc6sfjPDu2lbZF0D9cg.re83MvfCyOkpgppnYlMJQEtSbJkPFE34Iybms56bKngg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-3%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279367140" },
                { name: "4주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjIy/MDAxNzc3ODYxMDAzNzE1.y7xbj2gZ40578UmU-Y4DTG8h3wYBu9ca5prqDO2j2kkg.-E5i5ni_aX_jhoM0c2pPQNNlE1hgY-mVksPC2ywT1nYg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-4%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279369158" },
                { name: "5주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjA2/MDAxNzc3ODYxMDA0OTYy.jUKZ7ghQVXpyoOWZzyG0zIOicRCmHVcZyofv7_GbYhog.H7sgz__enry2GEPm_vap3gZK4PJTi8y3WJXCwiEczdYg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-5%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279371111" },
                { name: "6주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTI5/MDAxNzc3ODYxMDAzMjI1.pk0zJG9F7fzC4hHYdbNvblJ3vtRcJ-7ZeawFeIWRizUg.IMY9pUnwDTtgkEEwZtU5UVQYhAflkscnuPDS44j-g7kg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-6%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279371890" },
                { name: "7주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTc5/MDAxNzc3ODYxMDAyOTI3.oDkrcmOPaZmfrBz3DPVT6mkvwi4ePX13vT3Fu6se3HAg.9t5yIJf293HBrvyyaSCxO92X-8_arTp3Ih0PxE_2I7sg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-7%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279372790" },
                { name: "8주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTQ2/MDAxNzc3ODYxMDA0NTY4.vaqL56RENebBRkYUE3x5FFnLg9Ur6EG5zWRv3br1HWcg.GgCeMYAsc2NZwXxZk_9rGKe70w8saiZ1MKsH4xHNaSgg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-8%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279373399" },
                { name: "9주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTUg/MDAxNzc3ODYxMDAzMjA3.d137LQZ9O4ioZbemu6cgvTGYN4vCfK-N8RYCxA1dtkYg.bhM3JG2_PKiNSlQ5WAisAg6BIj003RHMkH8I9K_goacg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-9%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279374083" },
                { name: "10주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjU2/MDAxNzc3ODYxMDAxNjYx.YVnye2S1OQivqmzgbanCSKo29WVwELNFaLKQsDRfLeIg.8uHLP3eAUmmCHLyViwr5jxfMqEeoy-I8gBpMaw4B8aog.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-10%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279374805" },
                { name: "11주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTA0/MDAxNzc3ODYxMDAxNzY5.hsgS6_rXvLJmAhw6lnkSZRa_o9QuYMTssxnoKD8jMkYg.TuoP839LhM1jQgNvOeHdCUcA9dxqez6GoIQq61dID08g.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-11%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279375707" },
                { name: "12주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjUw/MDAxNzc3ODYxMDAzNjY2.D5Xk87wZGP2N8VLFaRUFb12ngiBuUK8WOCtn9BZgynsg.eJua2Qiqa3gKNS4RInFMXx__3TzVq06xxvG_wOss_5Ug.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-12%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279377360" },
                { name: "13주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTk0/MDAxNzc3ODYxMDAzNTQ5.mq8cTj4p28oDEnwS9Z5dhkRZ1PcFhnX-W2DsW2Xu1f0g.J_CbyrYlOhTIH5SNw1PVsszVmimC2Fa7x0LyoZvV-lYg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-13%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279378139" },
                { name: "14주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDhfMTQy/MDAxNzc4MjQ3NDU3Njc5.nZ5Yg7qTT5_Se1AjalGwJGksYsXjzc-3lUoZhttuTIkg.ffKawDio7W2Y06NL5vaAfSDJjJw6GdVNrwgrLb5Q4acg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-14%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279379158" },
                { name: "15주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfOCAg/MDAxNzc3ODYxMDAxNzQ2.7TBTH8OM76icQIW6gpfqVNFxJC2tEcpQDP_1NNMU6_Ig.AuIVeC9PjKQ8a68WHIZCRcjtX16TZ9dluyNtOsuKBrwg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-15%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279379913" },
                { name: "16주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfNTIg/MDAxNzc3ODYxMDA0OTg1.hzWDo2pxQnC1uno1iSxppUSWfGsOvKHMohfzjav_M_cg.CBluwssKpX8UTY9dtOJbDtKI7makUj5lpzpliQVJuRgg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-16%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279380833" },
                { name: "17주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfNzkg/MDAxNzc3ODYxMDA0ODM5.AR9-VOZIM_kRnRNKU8S6jmFvumiIo3oOBj_-Rt8JotAg.NnKFXATt2U8t3LYtG8M00e4He4wTgvnOFKC3e7psuhAg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-17%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279381532" },
                { name: "18주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTg2/MDAxNzc3ODYxMDA1NzQ3.bHoLBvjviAcXCFI60gCVn1I_2kCLDKvmKX6yqqnzAkgg.OmWyO1YWZC7Xbs6lubkpNE8bvtc2fykSpxgiv6E-3M4g.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-18%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279382995" },
                { name: "19주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTk3/MDAxNzc3ODYxMDA1NTA1.RiIpiOVFqx1nf7Kb10Yzu6tr0x9Xn0218cIFQ_aEEfMg.dBazZL2u_x8LiK5ayeNpxfwcBAZNkTeJqpO0A8Ent90g.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-19%EC%A3%BC%EB%85%84.png?type=w3840" },
                { name: "20주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjMz/MDAxNzc3ODYxMDAxOTYx.0Fqro4hsLIbtm1OSFjI9Tz5N8BfY8yXPEJLuSFehN4og.c_En9CsAhWZy0q-ZoUpThCkLyWRHPGFDrDr4m-N1xlYg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-20%EC%A3%BC%EB%85%84.png?type=w3840" },
                { name: "고액후원 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MTdfMjg1/MDAxNzc5MDA5OTQwOTIw.irYMqM4w9SEoBrbcRKuLRGPAHME531vt4dhufFrP-iEg.GVag7tChUiBd1GcithQi34DFQ2N2yTcJPUppqqWDLj4g.PNG/Gemini_Generated_Image_qnfqqtqnfqqtqnfq.png?type=w773" }
              ], ...[
                { name: "1주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDNfMjA4/MDAxNzc3ODA1MTUwODI5.06cxf7wJT0HnpIQuO2PrNsNU2hFukBWAvYLdVA-i71cg.aCc6P5LHTHe3CKPahl7EHu5I0qOapmlcr4vnG-x1J9og.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-1%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279372790" },
                { name: "2주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDNfMjE5/MDAxNzc3ODA1MTUyNDgx.iRiyJSUDN6ZC3PletlU5Gpw94e2WbuOzqqMNJHquh7Eg.Am2LpIqmFSFMTDICR6oZzEChogzb1IjSNv24wWTUN94g.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-2%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279364592" },
                { name: "3주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDNfMTYw/MDAxNzc3ODA1MTUyMzA4.fb6jFHGsbCMjkCo7MrvJMLzeeXc6sfjPDu2lbZF0D9cg.re83MvfCyOkpgppnYlMJQEtSbJkPFE34Iybms56bKngg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-3%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279367140" },
                { name: "4주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjIy/MDAxNzc3ODYxMDAzNzE1.y7xbj2gZ40578UmU-Y4DTG8h3wYBu9ca5prqDO2j2kkg.-E5i5ni_aX_jhoM0c2pPQNNlE1hgY-mVksPC2ywT1nYg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-4%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279369158" },
                { name: "5주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjA2/MDAxNzc3ODYxMDA0OTYy.jUKZ7ghQVXpyoOWZzyG0zIOicRCmHVcZyofv7_GbYhog.H7sgz__enry2GEPm_vap3gZK4PJTi8y3WJXCwiEczdYg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-5%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279371111" },
                { name: "6주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTI5/MDAxNzc3ODYxMDAzMjI1.pk0zJG9F7fzC4hHYdbNvblJ3vtRcJ-7ZeawFeIWRizUg.IMY9pUnwDTtgkEEwZtU5UVQYhAflkscnuPDS44j-g7kg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-6%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279371890" },
                { name: "7주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTc5/MDAxNzc3ODYxMDAyOTI3.oDkrcmOPaZmfrBz3DPVT6mkvwi4ePX13vT3Fu6se3HAg.9t5yIJf293HBrvyyaSCxO92X-8_arTp3Ih0PxE_2I7sg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-7%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279372790" },
                { name: "8주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTQ2/MDAxNzc3ODYxMDA0NTY4.vaqL56RENebBRkYUE3x5FFnLg9Ur6EG5zWRv3br1HWcg.GgCeMYAsc2NZwXxZk_9rGKe70w8saiZ1MKsH4xHNaSgg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-8%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279373399" },
                { name: "9주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTUg/MDAxNzc3ODYxMDAzMjA3.d137LQZ9O4ioZbemu6cgvTGYN4vCfK-N8RYCxA1dtkYg.bhM3JG2_PKiNSlQ5WAisAg6BIj003RHMkH8I9K_goacg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-9%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279374083" },
                { name: "10주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjU2/MDAxNzc3ODYxMDAxNjYx.YVnye2S1OQivqmzgbanCSKo29WVwELNFaLKQsDRfLeIg.8uHLP3eAUmmCHLyViwr5jxfMqEeoy-I8gBpMaw4B8aog.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-10%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279374805" },
                { name: "11주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTA0/MDAxNzc3ODYxMDAxNzY5.hsgS6_rXvLJmAhw6lnkSZRa_o9QuYMTssxnoKD8jMkYg.TuoP839LhM1jQgNvOeHdCUcA9dxqez6GoIQq61dID08g.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-11%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279375707" },
                { name: "12주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjUw/MDAxNzc3ODYxMDAzNjY2.D5Xk87wZGP2N8VLFaRUFb12ngiBuUK8WOCtn9BZgynsg.eJua2Qiqa3gKNS4RInFMXx__3TzVq06xxvG_wOss_5Ug.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-12%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279377360" },
                { name: "13주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTk0/MDAxNzc3ODYxMDAzNTQ5.mq8cTj4p28oDEnwS9Z5dhkRZ1PcFhnX-W2DsW2Xu1f0g.J_CbyrYlOhTIH5SNw1PVsszVmimC2Fa7x0LyoZvV-lYg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-13%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279378139" },
                { name: "14주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDhfMTQy/MDAxNzc4MjQ3NDU3Njc5.nZ5Yg7qTT5_Se1AjalGwJGksYsXjzc-3lUoZhttuTIkg.ffKawDio7W2Y06NL5vaAfSDJjJw6GdVNrwgrLb5Q4acg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-14%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279379158" },
                { name: "15주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfOCAg/MDAxNzc3ODYxMDAxNzQ2.7TBTH8OM76icQIW6gpfqVNFxJC2tEcpQDP_1NNMU6_Ig.AuIVeC9PjKQ8a68WHIZCRcjtX16TZ9dluyNtOsuKBrwg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-15%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279379913" },
                { name: "16주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfNTIg/MDAxNzc3ODYxMDA0OTg1.hzWDo2pxQnC1uno1iSxppUSWfGsOvKHMohfzjav_M_cg.CBluwssKpX8UTY9dtOJbDtKI7makUj5lpzpliQVJuRgg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-16%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279380833" },
                { name: "17주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfNzkg/MDAxNzc3ODYxMDA0ODM5.AR9-VOZIM_kRnRNKU8S6jmFvumiIo3oOBj_-Rt8JotAg.NnKFXATt2U8t3LYtG8M00e4He4wTgvnOFKC3e7psuhAg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-17%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279381532" },
                { name: "18주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTg2/MDAxNzc3ODYxMDA1NzQ3.bHoLBvjviAcXCFI60gCVn1I_2kCLDKvmKX6yqqnzAkgg.OmWyO1YWZC7Xbs6lubkpNE8bvtc2fykSpxgiv6E-3M4g.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-18%EC%A3%BC%EB%85%84.png?type=w3840", link: "https://blog.naver.com/ulkook120/224279382995" },
                { name: "19주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMTk3/MDAxNzc3ODYxMDA1NTA1.RiIpiOVFqx1nf7Kb10Yzu6tr0x9Xn0218cIFQ_aEEfMg.dBazZL2u_x8LiK5ayeNpxfwcBAZNkTeJqpO0A8Ent90g.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-19%EC%A3%BC%EB%85%84.png?type=w3840" },
                { name: "20주년 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MDRfMjMz/MDAxNzc3ODYxMDAxOTYx.0Fqro4hsLIbtm1OSFjI9Tz5N8BfY8yXPEJLuSFehN4og.c_En9CsAhWZy0q-ZoUpThCkLyWRHPGFDrDr4m-N1xlYg.PNG/%ED%9B%84%EC%9B%90%EA%B0%90%EC%82%AC%EC%B9%B4%EB%93%9C-20%EC%A3%BC%EB%85%84.png?type=w3840" },
                { name: "고액후원 감사카드", image: "https://postfiles.pstatic.net/MjAyNjA1MTdfMjg1/MDAxNzc5MDA5OTQwOTIw.irYMqM4w9SEoBrbcRKuLRGPAHME531vt4dhufFrP-iEg.GVag7tChUiBd1GcithQi34DFQ2N2yTcJPUppqqWDLj4g.PNG/Gemini_Generated_Image_qnfqqtqnfqqtqnfq.png?type=w773" }
              ]].map((card, i) => {
                const CardContent = (
                  <div className="group flex flex-col items-center w-[220px] shrink-0">
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl mb-4 shadow-md transition-all duration-500 group-hover:shadow-xl ring-1 ring-stone-100 bg-white">
                      <img 
                        src={card.image} 
                        alt={card.name} 
                        className="w-full h-full object-contain p-2 transition-transform duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <h3 className="font-sans text-lg text-[#1A237E] group-hover:text-secondary transition-colors duration-300 text-center truncate w-full font-bold">{card.name}</h3>
                  </div>
                );

                if (card.link) {
                  return (
                    <a 
                      key={i} 
                      href={card.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block transition-transform hover:-translate-y-1"
                    >
                      {CardContent}
                    </a>
                  );
                }

                return (
                  <div key={i}>
                    {CardContent}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Participation CTA */}
      <section className="py-8 md:py-10 bg-primary-container relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="w-full h-full hanji-texture"></div>
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
          <motion.h2 
            className="font-sans text-white mb-6 text-[32px] md:text-[48px] font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            우리의 뿌리, 함께 지켜나갑니다.
          </motion.h2>
          <p className="font-sans text-white mb-10 text-lg md:text-xl font-medium">
            울산국학원과 함께 홍익의 가치를 나누고 실천하는 든든한 동반자가 되어주세요.
          </p>
          <a 
            href="https://www.kookhakwon.org/Support/Support.aspx?supportType=1"
            target="_blank"
            rel="noopener noreferrer"
            className="px-16 py-6 bg-[#FDFCF0] text-primary font-sans font-bold rounded-full hover:scale-105 transition-transform text-xl md:text-2xl shadow-xl inline-block"
          >
            후원 안내
          </a>
        </div>
      </section>

      {/* Membership Info */}
      <section className="py-10 md:py-16 bg-[#f5f2e9]" id="후원안내">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-20">
            {[
              { 
                icon: Calendar, 
                title: "CMS 정기 후원", 
                text: "매월 정기적인 나눔으로 울산국학원의 뿌리를 튼튼하게 지탱해주시는 가장 소중한 동반자입니다."
              },
              { 
                icon: Heart, 
                title: "일시 후원", 
                text: "기쁜 일이나 의미 있는 날, 따뜻한 마음을 모아 자유롭게 참여하는 소중한 응원입니다."
              },
              { 
                icon: Building2, 
                title: "기업 및 단체 후원", 
                text: "홍익의 가치를 함께 실천하며 사회적 책임을 다하는 기업 파트너를 기다립니다."
              },
            ].map((item, i) => (
              <motion.div 
                key={item.title}
                className="group flex flex-col bg-stone-50 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-stone-100 p-8 pt-10"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <h3 className="font-sans text-2xl mb-4 text-[#1A237E] group-hover:text-primary transition-colors font-bold">{item.title}</h3>
                <p className="font-sans text-stone-800 text-[18px] leading-relaxed font-medium">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="bg-white rounded-[40px] p-10 md:p-16 shadow-lg border border-stone-100">
            <div className="flex flex-col items-center text-center mb-16 gap-4">
              <h3 className="font-sans text-3xl md:text-4xl text-[#1A237E] font-bold">회원 혜택</h3>
              <p className="font-sans text-stone-700 font-medium text-[20px]">
                후원 회원님의 건강, 행복, 사랑의 혜택이 커질수 있도록 노력하겠습니다.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {[
                { icon: Percent, text: "협력 단체 프로그램\n수강료 할인 혜택", color: "#17717a" },
                { icon: Activity, text: "년 2회 건강체크와 상담\n(브레인트레이닝센터)", color: "#FF3B30" },
                { icon: Wind, text: "힐링명상체험\n(실시간 온라인)", color: "#4CAF50" },
                { icon: Receipt, text: "기부금 영수증 발행\n세액 공제 혜택", color: "#1A237E" },
              ].map((benefit, i) => (
                <div key={i} className="flex flex-col items-center text-center group">
                  <div className="relative w-24 h-24 mb-6">
                    <div className="absolute inset-0 bg-stone-50 rounded-2xl rotate-3 group-hover:rotate-6 transition-transform"></div>
                    <div className="absolute inset-0 bg-white shadow-sm rounded-2xl flex items-center justify-center border border-stone-100 group-hover:-translate-y-2 transition-transform">
                      <benefit.icon 
                        className="w-10 h-10" 
                        style={{ color: benefit.color }}
                      />
                    </div>
                  </div>
                  <p className="font-sans font-bold text-stone-700 text-base md:text-lg whitespace-pre-line leading-snug">
                    {benefit.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Partners List */}
      <section className="py-16 md:py-24 bg-white border-y border-stone-100" id="협력단체">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <motion.span 
              className="text-secondary font-sans font-bold uppercase tracking-widest text-xs mb-4 block"
              {...fadeInUp}
            >
              OUR PARTNERS
            </motion.span>
            <h2 className="font-sans text-[#1A237E] text-[32px] md:text-[40px] font-bold">협력 단체</h2>
            <p className="font-sans text-stone-700 mt-4 text-base md:text-lg max-w-4xl md:max-w-none mx-auto leading-relaxed md:whitespace-nowrap font-medium">
              울산국학원과 함께 홍익의 가치를 실천하고 지역사회의 밝은 미래를 열어가는 든든한 파트너들입니다.
            </p>
          </div>
          
        <div className="w-full overflow-hidden py-10 relative">
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10"></div>
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10"></div>
          
          <motion.div 
            className="flex gap-8 px-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{
              duration: 100, // Very slow speed
              ease: "linear",
              repeat: Infinity,
            }}
            style={{ width: "fit-content" }}
          >
            {[...[
              { name: '울산광역시', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMTcy/MDAxNzc4NzY2MDY1Mjgx.MipEu2N_gV6qAAr9OUFbvfuqNdzBMli1u6MavlzVS9og.sWhFcJHYira2kz7VpgsuZZSmmeUGRH_X_FQQXf3hEPgg.GIF/logo02.gif?type=w3840', link: 'https://www.ulsan.go.kr' },
              { name: '울산경찰서', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfNDIg/MDAxNzc4NzY2MTMyMzM3.4dieaZtR4lpN_oHvRxunqC_ZJeXReRd3XZnkszi6ouog.NXCx7I4QLAJvCywmxwxuJ6sf-eXIU6x4vYL7N_lFUHcg.PNG/Capture_2026_0514_214738.png?type=w3840', link: 'https://www.uspolice.go.kr' },
              { name: '울산국학운동시민연합', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMjY5/MDAxNzc4NzY2MTcwMzcw.dyl6X23v9pi0YoPw1_0VJRAfPORa0mBwJRrpsU_0eYQg.BOxYdUuJt7o3umhFwG8LIoREuyzbjIj9hh4iPRwysKsg.PNG/Capture_2026_0514_215108.png?type=w3840', link: 'http://www.kookhak.org' },
              { name: '울산국학기공협회', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMTAw/MDAxNzc4NzY2MjI4ODky.XcXTxQhz2O8lLrBITcIp7qi2lHRDUqHeLQZLPUxtexQg.1F1Gt_1YuWAIeqQYt5B46elicwxUkWGSrVY3pc84Z1Yg.PNG/Gemini_Generated_Image_l8zm56l8zm56l8zm.png?type=w3840', link: 'http://sports.kookhak.org' },
              { name: '지구시민연합', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMjI3/MDAxNzc4NzY2NDYzMTYz.1FNckQdBVZCEqoDgkQWZ62POnhn5xXOu7ia0Ow2lim0g.gOUUqYzweaJtPyYeOFrg4Qa6bPFjFhTzWmJaS77VDyUg.PNG/Gemini_Generated_Image_tnc6lttnc6lttnc6.png?type=w3840', link: 'http://earthcitizen.or.kr' },
              { name: '국학원 본원', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMTkz/MDAxNzc4NzY4OTIzMzcz.tghc8bZ09YpcO5WAAhhGoijvOr7aipUXRRosu5Wpdo4g.Z6X2tiNx2qoreu8cVzVssVMa3DgrYBIAFP6y-Z_mlNQg.PNG/Gemini_Generated_Image_dy8tgady8tgady8t.png?type=w773', link: 'http://www.kookhakwon.org' },
              { name: '글로벌사이버대학교', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfOTIg/MDAxNzc4NzY2NzY2MzY1.xYTd8Is5PxWAqttuFGSb85W_zPEaQQjGfcOud_4l8eYg.9STTtklFUREYe5mnRzrlC52KHgDM6dU_E8-9zR5b3nkg.PNG/%EA%B8%80%EB%A1%9C%EB%B2%8C%EC%82%AC%EC%9D%B4%EB%B2%84%EB%8C%80%ED%95%99%EA%B5%901.png?type=w3840', link: 'https://www.global.ac.kr' },
              { name: '사회서비스센터', image: 'https://postfiles.pstatic.net/MjAyNjA1MTdfMzAg/MDAxNzc5MDA0MjI2NzA5.qcMQdGt1XQI_OQJNsdFvRKSFgTDPO_lrgAmj6BcxMSIg.qWzMp8qbh09QYF83Y-effnL6e8TK3-hxdeZ215Mo3Ecg.JPEG/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._(2).jpg?type=w3840', link: 'https://www.ussag.or.kr/main.html' },
              { name: '브레인트레이닝센터', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfNzgg/MDAxNzc4NzY2ODk0MTYy.6zMrNEpXxlENnl1gWese0djV5Sy1NOGmHD9aDOxpyv8g.v_XwumnoRbxhw3ZGJcD-2OFN8sgbHO-kvdmn5aOIbMkg.PNG/Gemini_Generated_Image_iy276miy276miy27.png?type=w3840', link: 'https://www.braintraining.co.kr' },
              { name: '국학학술원', image: 'https://postfiles.pstatic.net/MjAyNjA1MTdfMjU1/MDAxNzc5MDA1MDA3MDgx.Dtzo0p5o-9Nkhphe0zFaNoVlIoGlV6s4J6uiuauSsFgg.c1DMm8C37m3CYEzVRyyAHbspKI0f1lYZ2azffp-Y20og.JPEG/%EC%82%AC%EC%9D%B4%EB%B2%84%EA%B5%AD%ED%95%99%ED%95%99%EC%88%A0%EC%9B%90.jpg?type=w3840', link: 'http://www.kookhak.org' }
            ], ...[
              { name: '울산광역시', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMTcy/MDAxNzc4NzY2MDY1Mjgx.MipEu2N_gV6qAAr9OUFbvfuqNdzBMli1u6MavlzVS9og.sWhFcJHYira2kz7VpgsuZZSmmeUGRH_X_FQQXf3hEPgg.GIF/logo02.gif?type=w3840', link: 'https://www.ulsan.go.kr' },
              { name: '울산경찰서', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfNDIg/MDAxNzc4NzY2MTMyMzM3.4dieaZtR4lpN_oHvRxunqC_ZJeXReRd3XZnkszi6ouog.NXCx7I4QLAJvCywmxwxuJ6sf-eXIU6x4vYL7N_lFUHcg.PNG/Capture_2026_0514_214738.png?type=w3840', link: 'https://www.uspolice.go.kr' },
              { name: '울산국학운동시민연합', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMjY5/MDAxNzc4NzY2MTcwMzcw.dyl6X23v9pi0YoPw1_0VJRAfPORa0mBwJRrpsU_0eYQg.BOxYdUuJt7o3umhFwG8LIoREuyzbjIj9hh4iPRwysKsg.PNG/Capture_2026_0514_215108.png?type=w3840', link: 'http://www.kookhak.org' },
              { name: '울산국학기공협회', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMTAw/MDAxNzc4NzY2MjI4ODky.XcXTxQhz2O8lLrBITcIp7qi2lHRDUqHeLQZLPUxtexQg.1F1Gt_1YuWAIeqQYt5B46elicwxUkWGSrVY3pc84Z1Yg.PNG/Gemini_Generated_Image_l8zm56l8zm56l8zm.png?type=w3840', link: 'http://sports.kookhak.org' },
              { name: '지구시민연합', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMjI3/MDAxNzc4NzY2NDYzMTYz.1FNckQdBVZCEqoDgkQWZ62POnhn5xXOu7ia0Ow2lim0g.gOUUqYzweaJtPyYeOFrg4Qa6bPFjFhTzWmJaS77VDyUg.PNG/Gemini_Generated_Image_tnc6lttnc6lttnc6.png?type=w3840', link: 'http://earthcitizen.or.kr' },
              { name: '국학원 본원', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfMTkz/MDAxNzc4NzY4OTIzMzcz.tghc8bZ09YpcO5WAAhhGoijvOr7aipUXRRosu5Wpdo4g.Z6X2tiNx2qoreu8cVzVssVMa3DgrYBIAFP6y-Z_mlNQg.PNG/Gemini_Generated_Image_dy8tgady8tgady8t.png?type=w773', link: 'http://www.kookhakwon.org' },
              { name: '글로벌사이버대학교', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfOTIg/MDAxNzc4NzY2NzY2MzY1.xYTd8Is5PxWAqttuFGSb85W_zPEaQQjGfcOud_4l8eYg.9STTtklFUREYe5mnRzrlC52KHgDM6dU_E8-9zR5b3nkg.PNG/%EA%B8%80%EB%A1%9C%EB%B2%8C%EC%82%AC%EC%9D%B4%EB%B2%84%EB%8C%80%ED%95%99%EA%B5%901.png?type=w3840', link: 'https://www.global.ac.kr' },
              { name: '사회서비스센터', image: 'https://postfiles.pstatic.net/MjAyNjA1MTdfMzAg/MDAxNzc5MDA0MjI2NzA5.qcMQdGt1XQI_OQJNsdFvRKSFgTDPO_lrgAmj6BcxMSIg.qWzMp8qbh09QYF83Y-effnL6e8TK3-hxdeZ215Mo3Ecg.JPEG/%EC%A0%9C%EB%AA%A9%EC%9D%84_%EC%9E%85%EB%A0%A5%ED%95%B4%EC%A3%BC%EC%84%B8%EC%9A%94._(2).jpg?type=w3840', link: 'https://www.ussag.or.kr/main.html' },
              { name: '브레인트레이닝센터', image: 'https://postfiles.pstatic.net/MjAyNjA1MTRfNzgg/MDAxNzc4NzY2ODk0MTYy.6zMrNEpXxlENnl1gWese0djV5Sy1NOGmHD9aDOxpyv8g.v_XwumnoRbxhw3ZGJcD-2OFN8sgbHO-kvdmn5aOIbMkg.PNG/Gemini_Generated_Image_iy276miy276miy27.png?type=w3840', link: 'https://www.braintraining.co.kr' },
              { name: '국학학술원', image: 'https://postfiles.pstatic.net/MjAyNjA1MTdfMjU1/MDAxNzc5MDA1MDA3MDgx.Dtzo0p5o-9Nkhphe0zFaNoVlIoGlV6s4J6uiuauSsFgg.c1DMm8C37m3CYEzVRyyAHbspKI0f1lYZ2azffp-Y20og.JPEG/%EC%82%AC%EC%9D%B4%EB%B2%84%EA%B5%AD%ED%95%99%ED%95%99%EC%88%A0%EC%9B%90.jpg?type=w3840', link: 'http://www.kookhak.org' }
            ]].map((partner, i) => (
              <a 
                key={i}
                href={partner.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative w-[180px] h-[180px] shrink-0 overflow-hidden rounded-3xl bg-white border border-stone-100 shadow-md hover:shadow-xl transition-all duration-500 block"
              >
                <img 
                  src={partner.image} 
                  alt={partner.name}
                  className="absolute inset-0 w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              </a>
            ))}
          </motion.div>
        </div>
        </div>
      </section>

      {/* Contact & Map */}
      <section className="py-12 md:py-16 bg-stone-100" id="문의하기">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16">
          <motion.div className="space-y-8" {...fadeInUp}>
            <div>
              <h2 className="font-sans text-[32px] md:text-[40px] font-bold">문의하기</h2>
              <p className="font-sans text-stone-800 mt-3 text-base md:text-lg font-medium">프로그램 참여 및 제휴 문의를 남겨주세요.</p>
            </div>
            <form className="space-y-6" onSubmit={(e) => handleContactSubmit(e)}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm md:text-base font-sans font-bold mb-2 uppercase tracking-wider">성함 *</label>
                  <input 
                    required
                    className="w-full bg-white border-0 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-colors py-3 px-1" 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm md:text-base font-sans font-bold mb-2 uppercase tracking-wider">연락처 *</label>
                  <input 
                    required
                    className="w-full bg-white border-0 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-colors py-3 px-1" 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm md:text-base font-sans font-bold mb-2 uppercase tracking-wider">이메일 주소</label>
                <input 
                  className="w-full bg-white border-0 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-colors py-3 px-1" 
                  type="email" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm md:text-base font-sans font-bold mb-2 uppercase tracking-wider">문의내용</label>
                <textarea 
                  className="w-full bg-white border-0 border-b border-outline-variant focus:border-secondary focus:ring-0 transition-colors py-3 px-1 resize-none" 
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                ></textarea>
              </div>
              
              {submitStatus === 'success' && (
                <div className="p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  문의가 성공적으로 전달되었습니다. 감사합니다.
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
                  데이터 전송 중 오류가 발생했습니다. 다시 시도해주세요.
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-primary text-white font-sans font-bold rounded-xl hover:opacity-90 transition-opacity shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? '전송 중...' : '문의 보내기'}
              </button>
            </form>
          </motion.div>

          <motion.div className="space-y-8" {...fadeInUp} transition={{ delay: 0.2 }}>
            <div>
              <h2 className="font-sans text-[32px] md:text-[40px] font-bold">오시는 길</h2>
              <p className="font-sans text-on-surface-variant mt-3">방문을 환영합니다.</p>
            </div>
            <a 
              href="https://maps.app.goo.gl/uXv7aL6s6E7s8K8y7" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block rounded-3xl overflow-hidden h-80 shadow-2xl border border-white/50 relative group"
            >
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3246.6878359582442!2d129.3121311763063!3d35.53671113789855!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x356632ae8b75be2d%3A0x99b3d0e110343199!2z7Jq47IKw6rWt7ZWZ7JuQ!5e0!3m2!1sko!2skr!4v1777641107309!5m2!1sko!2skr" 
                className="w-full h-full border-0 pointer-events-none" 
                allowFullScreen={true} 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                <div className="bg-white/90 px-4 py-2 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                  <MapPin className="w-3 h-3 text-secondary" />
                  구글 맵에서 크게 보기
                </div>
              </div>
            </a>
            <div className="space-y-6">
              {[
                { icon: MapPin, label: "주소", val: "울산광역시 남구 돋질로 76, 6층" },
                { icon: Phone, label: "전화번호", val: "052-268-8065" },
                { icon: Mail, label: "이메일", val: "ulkook120@naver.com" }
              ].map(info => (
                <div key={info.label} className="flex items-start gap-4">
                  <info.icon className="text-secondary w-5 h-5 mt-0.5" />
                  <div>
                    <h4 className="font-sans font-bold text-sm md:text-base uppercase tracking-widest text-[#1a237e]">{info.label}</h4>
                    <p className="text-on-surface-variant text-base md:text-lg mt-1">{info.val}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F5F2E8] border-t border-stone-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="text-[20px] font-sans font-bold text-stone-500">상호: 울산국학원</div>
            <div className="text-[16px] font-sans font-medium text-stone-500">고유번호증: 610-82-67406</div>
            <p className="text-stone-500 text-sm font-sans">
              © 2005 울산국학원. Institute for Traditional Korean Culture Studies.
            </p>

          </div>
          
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4 font-sans font-bold text-stone-500">
            <div className="flex gap-8 md:gap-12">
              {[
                { 
                  name: '블로그', 
                  href: 'https://blog.naver.com/ulkook120',
                  icon: 'https://postfiles.pstatic.net/MjAyNjA1MTlfNzIg/MDAxNzc5MTYzMDg1MjI1.u7tt3-HW3qptjlXWXor92KZdTWIyr2aqbBtwsyWHif0g.oUaL7DfkfTWdZvSg-fdMoPMfJ93SZa34zgU4poQCxG4g.JPEG/%EB%B8%94%EB%A1%9C%EA%B7%B8.jpg?type=w3840'
                },
                { 
                  name: '유튜브', 
                  href: 'https://youtube.com/@tv-pn4tp?si=Rbs0GdgmdUGcB_cv',
                  icon: 'https://postfiles.pstatic.net/MjAyNjA1MTlfMjY3/MDAxNzc5MTYzMDkwOTc5.FOc2UTAaL9oii6nQErWRr_DfFQT-EBUgarj54h6BupUg.-xgC-5-ysCXT8CCim1AxbyNsHiFPbvEiaabcl9_KaDAg.JPEG/%EC%9C%A0%ED%8A%9C%EB%B8%8C.jpg?type=w3840'
                },
                { 
                  name: '인스타', 
                  href: '#',
                  icon: 'https://postfiles.pstatic.net/MjAyNjA1MTlfODcg/MDAxNzc5MTYzMDk0NTY2.AWA2AillTLJy9kwqdcgLVw0OrVEh6LhIO3t-CAjwuqQg.KYYzdzWWce0NV-CIy5DuZsCFb852ZMDFQuXjRO65eyog.JPEG/%EC%9D%B8%EC%8A%A4%ED%83%80.jpg?type=w3840'
                }
              ].map(link => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  target={link.href !== '#' ? "_blank" : undefined}
                  rel={link.href !== '#' ? "noopener noreferrer" : undefined}
                  className="group flex flex-col items-center transition-all duration-300"
                >
                  <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden shadow-sm group-hover:shadow-md group-hover:-translate-y-1 transition-all duration-300 border border-stone-100 bg-white">
                    <img 
                      src={link.icon} 
                      alt={link.name} 
                      className="w-full h-full object-contain"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* Admin Panel Modal */}
      <AnimatePresence>
        {showAdminPanel && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-black/40"
            >
              <div className="p-8 border-b border-stone-100 flex flex-col md:flex-row justify-between items-start md:items-center bg-stone-50/50 gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-sans text-[#1A237E] font-bold">관리자 패널</h2>
                    <p className="text-sm font-sans text-stone-500">사이트의 데이터를 효율적으로 관리합니다.</p>
                  </div>
                </div>
                
                <div className="flex bg-stone-200/50 p-1 rounded-xl">
                  <button 
                    onClick={() => setAdminTab('submissions')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'submissions' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    신청 현황
                  </button>
                  <button 
                    onClick={() => setAdminTab('gallery')}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${adminTab === 'gallery' ? 'bg-white text-primary shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
                  >
                    갤러리 관리
                  </button>
                </div>

                <button 
                  onClick={() => setShowAdminPanel(false)}
                  className="absolute top-6 right-6 md:static w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-stone-500" />
                </button>
              </div>

              <div className="flex-grow overflow-auto p-8 custom-scrollbar">
                {adminTab === 'submissions' ? (
                  submissions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-stone-400 space-y-4">
                      <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center">
                        <Clock className="w-8 h-8 opacity-20" />
                      </div>
                      <p className="font-sans font-medium">아직 접수된 데이터가 없습니다.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {submissions.map((item) => (
                        <div 
                          key={item.id} 
                          className="bg-white rounded-2xl p-6 border border-stone-100 shadow-sm hover:shadow-md transition-shadow group relative"
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-secondary/5 rounded-xl flex items-center justify-center text-secondary font-bold">
                                {item.name?.[0]}
                              </div>
                              <div>
                                <h3 className="font-bold text-stone-800">{item.name}</h3>
                                <span className="text-[10px] text-stone-400 flex items-center gap-1 uppercase tracking-wider font-bold">
                                  {item.source}
                                </span>
                              </div>
                            </div>
                            <button 
                              onClick={() => handleDeleteSubmission(item.id)}
                              className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              title="삭제"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="space-y-3 text-sm font-sans">
                            <div className="flex items-center gap-3 text-stone-600">
                              <Phone className="w-3.5 h-3.5 opacity-40 shrink-0" />
                              <span className="tabular-nums">{item.phone}</span>
                            </div>
                            {item.email && (
                              <div className="flex items-center gap-3 text-stone-600">
                                <Mail className="w-3.5 h-3.5 opacity-40 shrink-0" />
                                <span className="truncate">{item.email}</span>
                              </div>
                            )}
                            <div className="mt-4 p-4 bg-stone-50 rounded-xl text-xs text-stone-700 leading-relaxed min-h-[60px] border border-stone-100/50">
                              {item.message || <span className="text-stone-300 italic">내용 없음</span>}
                            </div>
                            <div className="flex items-center justify-end pt-2">
                               <span className="text-[10px] text-stone-400 font-medium">
                                {item.createdAt?.toDate ? item.createdAt.toDate().toLocaleString('ko-KR') : '방금 전'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-8">
                    {/* Add Gallery Form */}
                    <form onSubmit={handleAddGalleryItem} className="bg-stone-50 p-6 rounded-2xl border border-stone-100 flex flex-col gap-4">
                      <div className="flex-grow space-y-4 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">이미지 제목 *</label>
                            <input 
                              type="text" 
                              required
                              placeholder="활동 명칭"
                              value={newGalleryItem.title}
                              onChange={(e) => setNewGalleryItem({...newGalleryItem, title: e.target.value})}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">이미지 URL *</label>
                            <input 
                              type="url" 
                              required
                              placeholder="https://..."
                              value={newGalleryItem.url}
                              onChange={(e) => setNewGalleryItem({...newGalleryItem, url: e.target.value})}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">연결 링크 (선택)</label>
                            <input 
                              type="url" 
                              placeholder="https://... (클릭 시 이동할 주소)"
                              value={newGalleryItem.linkUrl}
                              onChange={(e) => setNewGalleryItem({...newGalleryItem, linkUrl: e.target.value})}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-stone-400 uppercase tracking-wider">설명 (선택)</label>
                            <input 
                              type="text" 
                              placeholder="이미지에 대한 짧은 설명"
                              value={newGalleryItem.description}
                              onChange={(e) => setNewGalleryItem({...newGalleryItem, description: e.target.value})}
                              className="w-full bg-white border border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <button 
                          type="submit"
                          className="bg-primary text-white px-8 py-2.5 rounded-xl hover:opacity-90 transition-opacity font-bold flex items-center gap-2"
                        >
                          <Plus className="w-5 h-5" />
                          이미지 추가
                        </button>
                      </div>
                    </form>

                    {/* Gallery Items List */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {galleryItems.map((item) => (
                        <div key={item.id} className="group relative bg-white border border-stone-100 rounded-2xl overflow-hidden shadow-sm">
                          <div className="aspect-[4/3] overflow-hidden">
                            <img src={item.url} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          </div>
                          <div className="p-4 flex justify-between items-center bg-white relative z-10">
                            <div>
                              <h4 className="font-bold text-stone-800 text-sm">{item.title}</h4>
                              <p className="text-[10px] text-stone-400 truncate max-w-[150px]">{item.description}</p>
                            </div>
                            <button 
                              onClick={() => handleDeleteGalleryItem(item.id)}
                              className="p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-stone-50 border-t border-stone-100 flex justify-end">
                <button 
                  onClick={() => setShowAdminPanel(false)}
                  className="px-6 py-2.5 bg-stone-200 text-stone-700 rounded-xl font-bold font-sans text-sm hover:bg-stone-300 transition-colors"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
