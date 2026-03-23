import React, { useState, useRef, useEffect } from 'react';
import { 
  Github, 
  Linkedin, 
  Mail, 
  Send, 
  Plus, 
  Image as ImageIcon, 
  FileText, 
  Database, 
  Layout, 
  BarChart3, 
  Code2,
  ExternalLink,
  User,
  Pencil,
  Trash2,
  Check,
  X,
  RotateCw,
  ZoomIn,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Cropper from 'react-easy-crop';
import getCroppedImg from './lib/imageUtils';

interface Certificate {
  id: string;
  name: string;
  url: string;
}

interface Project {
  id: string;
  title: string;
  img: string;
  link: string;
}

const ParticleBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    const particleCount = typeof window !== 'undefined' && window.innerWidth < 768 ? 30 : 60;
    const connectionDistance = typeof window !== 'undefined' && window.innerWidth < 768 ? 100 : 150;

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.size = Math.random() * 2 + 1;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
      }

      draw() {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx!.fillStyle = 'rgba(100, 149, 237, 0.5)';
        ctx!.fill();
      }
    }

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach((p, i) => {
        p.update();
        p.draw();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(100, 149, 237, ${1 - distance / connectionDistance})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    init();
    animate();

    const handleResize = () => init();
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 pointer-events-none z-0 opacity-40"
    />
  );
};

export default function App() {
  const [profileImage, setProfileImage] = useState<string | null>(() => localStorage.getItem('portfolio_profile_image'));
  const [certificates, setCertificates] = useState<Certificate[]>(() => {
    const saved = localStorage.getItem('portfolio_certificates');
    return saved ? JSON.parse(saved) : [];
  });
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('portfolio_projects');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', link: '', img: '' });
  const [contactMessage, setContactMessage] = useState({ name: '', email: '', message: '' });
  const [isSent, setIsSent] = useState(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isProfileConfirmed, setIsProfileConfirmed] = useState(() => localStorage.getItem('portfolio_profile_confirmed') === 'true');
  const [profileData, setProfileData] = useState(() => {
    const saved = localStorage.getItem('portfolio_profile_data');
    return saved ? JSON.parse(saved) : {
      name: 'SANTHIYA V',
      title1: 'Data Analyst',
      title2: 'UI/UX Designer',
      bio: 'Passionate about turning data into insights and creating beautiful, user-centric digital experiences.'
    };
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [tempProfileData, setTempProfileData] = useState(profileData);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('portfolio_profile_data', JSON.stringify(profileData));
  }, [profileData]);

  useEffect(() => {
    if (profileImage) localStorage.setItem('portfolio_profile_image', profileImage);
    else localStorage.removeItem('portfolio_profile_image');
  }, [profileImage]);

  useEffect(() => {
    localStorage.setItem('portfolio_profile_confirmed', String(isProfileConfirmed));
  }, [isProfileConfirmed]);

  useEffect(() => {
    localStorage.setItem('portfolio_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('portfolio_certificates', JSON.stringify(certificates));
  }, [certificates]);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  
  // Profile Image Editor State
  const [editingProfileImage, setEditingProfileImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [selectedFilter, setSelectedFilter] = useState('none');

  const profileInputRef = useRef<HTMLInputElement>(null);
  const certInputRef = useRef<HTMLInputElement>(null);
  const projectImgInputRef = useRef<HTMLInputElement>(null);
  const editProjectImgInputRef = useRef<HTMLInputElement>(null);

  const handleProfileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setEditingProfileImage(url);
      setIsProfileConfirmed(false);
      // Reset editor states
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setRotation(0);
      setSelectedFilter('none');
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveProfileImage = async () => {
    if (editingProfileImage && croppedAreaPixels) {
      try {
        const croppedImage = await getCroppedImg(
          editingProfileImage,
          croppedAreaPixels,
          rotation,
          { horizontal: false, vertical: false },
          selectedFilter
        );
        if (croppedImage) {
          setProfileImage(croppedImage);
          setEditingProfileImage(null);
          setIsProfileConfirmed(false);
          
          // Show success message and scroll to top as requested
          setShowSaveSuccess(true);
          setTimeout(() => setShowSaveSuccess(false), 3000);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const newCert: Certificate = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: url
      };
      setCertificates([...certificates, newCert]);
    }
  };

  const handleProjectImgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (editingProject) {
        setEditingProject({ ...editingProject, img: url });
      } else {
        setNewProject({ ...newProject, img: url });
      }
    }
  };

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProject.title && newProject.img) {
      const project: Project = {
        id: Math.random().toString(36).substr(2, 9),
        ...newProject
      };
      setProjects([...projects, project]);
      setNewProject({ title: '', link: '', img: '' });
      setIsAddingProject(false);
    }
  };

  const handleUpdateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingProject) {
      setProjects(projects.map(p => p.id === editingProject.id ? editingProject : p));
      setEditingProject(null);
    }
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleDeleteCert = (id: string) => {
    setCertificates(certificates.filter(c => c.id !== id));
  };

  const handleUpdateCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCert) {
      setCertificates(certificates.map(c => c.id === editingCert.id ? editingCert : c));
      setEditingCert(null);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => setIsSent(false), 5000);
    const mailtoLink = `mailto:santhiyavnkl@gmail.com?subject=Portfolio Message from ${contactMessage.name}&body=${contactMessage.message}%0D%0A%0D%0AFrom: ${contactMessage.email}`;
    window.location.href = mailtoLink;
  };

  const handleGlobalSave = () => {
    // Commit any pending profile changes
    if (isEditingProfile) {
      setProfileData(tempProfileData);
      setIsEditingProfile(false);
    }
    
    // Ensure all other edit modes are closed
    setEditingProject(null);
    setEditingCert(null);
    setIsAddingProject(false);
    
    // Show success message
    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const skills = [
    { name: 'SQL', icon: <Database className="w-5 h-5" />, color: 'bg-blue-900/40 text-blue-300 border-blue-500/30' },
    { name: 'HTML', icon: <Code2 className="w-5 h-5" />, color: 'bg-orange-900/40 text-orange-300 border-orange-500/30' },
    { name: 'CSS', icon: <Code2 className="w-5 h-5" />, color: 'bg-blue-900/40 text-blue-300 border-blue-500/30' },
    { name: 'JavaScript', icon: <Code2 className="w-5 h-5" />, color: 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30' },
    { name: 'PowerBI', icon: <BarChart3 className="w-5 h-5" />, color: 'bg-yellow-900/40 text-yellow-300 border-yellow-500/30' },
    { name: 'UI/UX Design', icon: <Layout className="w-5 h-5" />, color: 'bg-purple-900/40 text-purple-300 border-purple-500/30' },
  ];

  return (
    <div className="min-h-screen bg-[#030b1a] text-white font-sans selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      <ParticleBackground />

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#030b1a]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-lg sm:text-xl font-bold tracking-tight text-blue-400 truncate max-w-[150px] sm:max-w-none"
          >
            {profileData.name}
          </motion.h1>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden lg:flex gap-6">
              <a href="#about" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">About</a>
              <a href="#skills" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Skills</a>
              <a href="#projects" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Projects</a>
              <a href="#contact" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Save Success Toast */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] bg-green-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold"
          >
            <Check className="w-5 h-5" />
            Portfolio Saved Successfully!
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-24 relative z-10">
        
        {/* Hero / Profile Section */}
        <section id="about" className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center pt-4 sm:pt-0">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 text-center md:text-left order-2 md:order-1"
          >
            <div className="space-y-4">
              {isEditingProfile ? (
                <div className="space-y-4 bg-white/5 p-6 rounded-[2rem] border border-white/10 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Name</label>
                      <input 
                        type="text" 
                        value={tempProfileData.name}
                        onChange={(e) => setTempProfileData({...tempProfileData, name: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Title 1</label>
                      <input 
                        type="text" 
                        value={tempProfileData.title1}
                        onChange={(e) => setTempProfileData({...tempProfileData, title1: e.target.value})}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Title 2</label>
                    <input 
                      type="text" 
                      value={tempProfileData.title2}
                      onChange={(e) => setTempProfileData({...tempProfileData, title2: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-blue-400 uppercase tracking-widest ml-2">Bio</label>
                    <textarea 
                      value={tempProfileData.bio}
                      onChange={(e) => setTempProfileData({...tempProfileData, bio: e.target.value})}
                      rows={3}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {
                        setProfileData(tempProfileData);
                        setIsEditingProfile(false);
                      }}
                      className="p-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center justify-center gap-2 flex-1 text-sm font-bold"
                      title="Save Changes"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button 
                      onClick={() => {
                        setTempProfileData(profileData);
                        setIsEditingProfile(false);
                      }}
                      className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-xl transition-all flex items-center justify-center gap-2 flex-1 text-sm font-bold"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="relative group inline-block">
                    <h2 className="text-4xl sm:text-5xl font-bold leading-tight">
                      {profileData.title1} & <br />
                      <span className="text-blue-500">{profileData.title2}</span>
                    </h2>
                    <button 
                      onClick={() => {
                        setTempProfileData(profileData);
                        setIsEditingProfile(true);
                      }}
                      className="absolute -right-10 sm:-right-12 top-0 p-2 bg-white/5 border border-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:border-blue-500"
                      title="Edit Profile Text"
                    >
                      <Pencil className="w-4 h-4 text-blue-400" />
                    </button>
                  </div>
                  <p className="text-base sm:text-lg text-gray-400 max-w-md mx-auto md:mx-0">
                    {profileData.bio}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500 transition-all group"
              >
                <Linkedin className="w-5 h-5 group-hover:scale-110 transition-transform text-blue-400" />
              </a>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:border-blue-500 transition-all group"
              >
                <Github className="w-5 h-5 group-hover:scale-110 transition-transform text-gray-300" />
              </a>
              <a 
                href="#contact"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all font-medium shadow-lg shadow-blue-600/20"
              >
                <Mail className="w-4 h-4" />
                Contact Me
              </a>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative flex justify-center order-1 md:order-2"
          >
            <div className="relative group">
              {/* Circular Profile Shape */}
              <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden bg-white/5 border-4 border-blue-500/20 shadow-2xl relative flex items-center justify-center">
                {profileImage ? (
                  <img 
                    src={profileImage} 
                    alt="Santhiya V" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                    <User className="w-12 h-12 sm:w-20 sm:h-20 mb-2" />
                    <p className="text-xs sm:text-sm font-medium">No Profile Image</p>
                  </div>
                )}

                {/* Confirmed Badge Overlay */}
                {isProfileConfirmed && profileImage && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white p-1 rounded-full shadow-lg z-20 animate-in fade-in zoom-in duration-300">
                    <Check className="w-3 h-3" />
                  </div>
                )}
                
                <button 
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white gap-2 font-medium"
                >
                  <ImageIcon className="w-5 h-5" />
                  Edit Profile
                </button>
              </div>
              
              {/* Small Edit Icon Badge */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {profileImage && (
                  <>
                    <button 
                      onClick={() => {
                        setProfileImage(null);
                        setIsProfileConfirmed(false);
                      }}
                      className="bg-red-600/90 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-all border border-white/10"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => setIsProfileConfirmed(true)}
                      className={`${isProfileConfirmed ? 'bg-green-500' : 'bg-green-600/90'} text-white p-1.5 rounded-full shadow-lg hover:bg-green-600 transition-all border border-white/10`}
                      title="Save Profile"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </>
                )}
                <button 
                  onClick={() => profileInputRef.current?.click()}
                  className="bg-blue-600/90 text-white p-1.5 rounded-full shadow-lg hover:bg-blue-600 transition-all border border-white/10"
                  title="Change Profile Image"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            </div>
            <input 
              type="file" 
              ref={profileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleProfileUpload} 
            />
          </motion.div>
        </section>

        {/* Skills Section */}
        <section id="skills" className="space-y-8">
          <div className="flex items-end justify-between">
            <h3 className="text-2xl sm:text-3xl font-bold">Core Skills</h3>
            <p className="text-xs sm:text-sm text-blue-500 font-mono">01 / SKILLS</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
            {skills.map((skill, idx) => (
              <motion.div
                key={skill.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ 
                  y: -10, 
                  boxShadow: "0 10px 30px -10px rgba(59, 130, 246, 0.3)",
                  borderColor: "rgba(59, 130, 246, 0.5)"
                }}
                transition={{ 
                  type: "spring", 
                  stiffness: 300, 
                  damping: 15,
                  delay: idx * 0.05 
                }}
                className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-4 backdrop-blur-sm ${skill.color}`}
              >
                <div className="p-3 rounded-2xl bg-white/5">
                  {skill.icon}
                </div>
                <span className="font-bold text-sm uppercase tracking-wider">{skill.name}</span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* UI/UX Projects Section */}
        <section id="projects" className="space-y-8">
          <div className="flex items-end justify-between">
            <h3 className="text-2xl sm:text-3xl font-bold">UI/UX Design</h3>
            <p className="text-xs sm:text-sm text-blue-500 font-mono">02 / PROJECTS</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <AnimatePresence>
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -10 }}
                  className="group cursor-pointer"
                >
                  {editingProject?.id === project.id ? (
                    <form 
                      onSubmit={handleUpdateProject}
                      className="p-6 bg-[#0a192f] border border-blue-500/50 rounded-3xl flex flex-col gap-3 shadow-2xl"
                    >
                      <input 
                        type="text" 
                        placeholder="Project Title"
                        required
                        value={editingProject.title}
                        onChange={(e) => setEditingProject({...editingProject, title: e.target.value})}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                      />
                      <input 
                        type="url" 
                        placeholder="Project Link"
                        value={editingProject.link}
                        onChange={(e) => setEditingProject({...editingProject, link: e.target.value})}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white text-sm"
                      />
                      <div 
                        onClick={() => editProjectImgInputRef.current?.click()}
                        className="h-24 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors overflow-hidden"
                      >
                        <img src={editingProject.img} className="w-full h-full object-cover" alt="Preview" />
                      </div>
                      <input 
                        type="file" 
                        ref={editProjectImgInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleProjectImgUpload} 
                      />
                      <div className="flex gap-2">
                        <button 
                          type="button"
                          onClick={() => setEditingProject(null)}
                          className="flex-1 py-2 text-xs font-bold text-gray-500 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
                        >
                          Update
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="aspect-[4/3] rounded-3xl overflow-hidden bg-white/5 mb-4 relative border border-white/10">
                        <motion.img 
                          src={project.img} 
                          alt={project.title}
                          className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 opacity-80 group-hover:opacity-100"
                          referrerPolicy="no-referrer"
                          whileTap={{ scale: 0.95 }}
                        />
                        <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                          <a 
                            href={project.link || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-white p-3 rounded-full text-black hover:scale-110 transition-transform"
                          >
                            <ExternalLink className="w-5 h-5" />
                          </a>
                          <button 
                            onClick={() => setEditingProject(project)}
                            className="bg-blue-600 p-3 rounded-full text-white hover:scale-110 transition-transform"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => handleDeleteProject(project.id)}
                            className="bg-red-600 p-3 rounded-full text-white hover:scale-110 transition-transform"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="font-bold text-lg">{project.title}</h4>
                      <p className="text-sm text-gray-400">Visual Identity & Interaction</p>
                    </>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Add Project Button/Form */}
            {!isAddingProject ? (
              <button 
                onClick={() => setIsAddingProject(true)}
                className="aspect-[4/3] border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-all group bg-white/5"
              >
                <Plus className="w-10 h-10 group-hover:rotate-90 transition-transform" />
                <span className="font-bold">Add Project</span>
              </button>
            ) : (
              <motion.form 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleAddProject}
                className="aspect-[4/3] p-6 bg-[#0a192f] border border-white/10 rounded-3xl flex flex-col gap-3 shadow-2xl"
              >
                <input 
                  type="text" 
                  placeholder="Project Title"
                  required
                  value={newProject.title}
                  onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white"
                />
                <input 
                  type="url" 
                  placeholder="Project Link"
                  value={newProject.link}
                  onChange={(e) => setNewProject({...newProject, link: e.target.value})}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white"
                />
                <div 
                  onClick={() => projectImgInputRef.current?.click()}
                  className="flex-1 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors overflow-hidden"
                >
                  {newProject.img ? (
                    <img src={newProject.img} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <>
                      <ImageIcon className="w-6 h-6 text-gray-600" />
                      <span className="text-xs text-gray-500 mt-1">Upload Image</span>
                    </>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={projectImgInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleProjectImgUpload} 
                />
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="flex-1 py-2 text-sm font-bold text-gray-500 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700"
                  >
                    Save
                  </button>
                </div>
              </motion.form>
            )}
          </div>
        </section>

        {/* Certificates Section */}
        <section className="space-y-8">
          <div className="flex items-end justify-between">
            <h3 className="text-2xl sm:text-3xl font-bold">Certifications</h3>
            <p className="text-xs sm:text-sm text-blue-500 font-mono">03 / ACHIEVEMENTS</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {certificates.map((cert) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-white/5 border border-white/10 rounded-3xl flex items-start gap-4 shadow-sm hover:border-blue-500/50 transition-all group"
              >
                <div className="p-3 bg-blue-900/40 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  {editingCert?.id === cert.id ? (
                    <form onSubmit={handleUpdateCert} className="space-y-2">
                      <input 
                        type="text"
                        value={editingCert.name}
                        onChange={(e) => setEditingCert({...editingCert, name: e.target.value})}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <button type="submit" className="text-[10px] bg-blue-600 px-2 py-1 rounded">Save</button>
                        <button type="button" onClick={() => setEditingCert(null)} className="text-[10px] bg-white/10 px-2 py-1 rounded">Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <h4 className="font-bold truncate text-gray-200" title={cert.name}>{cert.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <a 
                          href={cert.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 font-medium hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                        <button 
                          onClick={() => setEditingCert(cert)}
                          className="text-xs text-blue-400 font-medium hover:underline flex items-center gap-1"
                        >
                          Edit <Pencil className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCert(cert.id)}
                          className="text-xs text-red-400 font-medium hover:underline flex items-center gap-1"
                        >
                          Delete <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
            
            <button 
              onClick={() => certInputRef.current?.click()}
              className="p-6 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-blue-500 hover:text-blue-400 transition-all group bg-white/5"
            >
              <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform" />
              <span className="font-bold text-sm">Add Certificate</span>
            </button>
            <input 
              type="file" 
              ref={certInputRef} 
              className="hidden" 
              onChange={handleCertUpload} 
            />
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="bg-gradient-to-br from-[#fff9f0] to-[#fffdf0] border border-orange-100 rounded-[3rem] p-8 md:p-16 overflow-hidden relative shadow-2xl shadow-orange-500/5">
          <div className="relative z-10 grid md:grid-cols-2 gap-12">
            <div className="space-y-6">
              <h3 className="text-4xl md:text-5xl font-bold leading-tight text-orange-900">
                Let's build <br />
                <span className="text-orange-600 italic">something great.</span>
              </h3>
              <p className="text-slate-600 max-w-sm">
                I'm always open to discussing new projects, creative ideas or 
                opportunities to be part of your visions.
              </p>
              <div className="pt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/20">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-orange-400 uppercase tracking-widest">Email Me</span>
                    <span className="font-medium text-lg text-orange-600">santhiyavnkl@gmail.com</span>
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input 
                  type="text" 
                  placeholder="Name"
                  required
                  value={contactMessage.name}
                  onChange={(e) => setContactMessage({...contactMessage, name: e.target.value})}
                  className="bg-white border border-orange-100 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500 transition-all w-full text-slate-900 placeholder:text-slate-400"
                />
                <input 
                  type="email" 
                  placeholder="Email"
                  required
                  value={contactMessage.email}
                  onChange={(e) => setContactMessage({...contactMessage, email: e.target.value})}
                  className="bg-white border border-orange-100 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500 transition-all w-full text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <textarea 
                placeholder="Your Message"
                required
                rows={4}
                value={contactMessage.message}
                onChange={(e) => setContactMessage({...contactMessage, message: e.target.value})}
                className="bg-white border border-orange-100 rounded-2xl px-6 py-4 focus:outline-none focus:border-orange-500 transition-all w-full resize-none text-slate-900 placeholder:text-slate-400"
              />
              <button 
                type="submit"
                disabled={isSent}
                className="w-full bg-orange-600 text-white font-bold py-4 rounded-2xl hover:bg-orange-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-orange-600/20"
              >
                {isSent ? 'Message Sent!' : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-orange-200/20 rounded-full blur-3xl" />
        </section>

      </main>

      <footer className="max-w-5xl mx-auto px-6 py-12 border-t border-white/5 text-center text-sm text-gray-500">
        <p>&copy; {new Date().getFullYear()} Santhiya V. All rights reserved.</p>
      </footer>

      {/* Image Editor Modal */}
      <AnimatePresence>
        {editingProfileImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#030b1a]/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0a192f] border border-white/10 w-full max-w-2xl rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl max-h-[90vh]"
            >
              <div className="sticky top-0 z-30 p-6 bg-[#0a192f]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-400" />
                  Edit Profile Image
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSaveProfileImage}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-600/20"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                  <button 
                    onClick={() => setEditingProfileImage(null)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto flex-1 custom-scrollbar">
                <div className="relative h-[400px] bg-black/40">
                  <Cropper
                    image={editingProfileImage}
                    crop={crop}
                    zoom={zoom}
                    rotation={rotation}
                    aspect={1}
                    onCropChange={setCrop}
                    onCropComplete={onCropComplete}
                    onZoomChange={setZoom}
                    onRotationChange={setRotation}
                    cropShape="round"
                    showGrid={false}
                    style={{
                      containerStyle: {
                        filter: selectedFilter
                      }
                    }}
                  />
                </div>

                <div className="p-8 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-400">
                      <ZoomIn className="w-4 h-4" />
                      Zoom
                    </div>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.1}
                      aria-labelledby="Zoom"
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-400 pt-2">
                      <RotateCw className="w-4 h-4" />
                      Rotation
                    </div>
                    <input
                      type="range"
                      value={rotation}
                      min={0}
                      max={360}
                      step={1}
                      aria-labelledby="Rotation"
                      onChange={(e) => setRotation(Number(e.target.value))}
                      className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm font-medium text-gray-400">
                      <Sliders className="w-4 h-4" />
                      Filters
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'None', value: 'none' },
                        { name: 'Mono', value: 'grayscale(100%)' },
                        { name: 'Sepia', value: 'sepia(100%)' },
                        { name: 'Pop', value: 'saturate(200%)' },
                        { name: 'Cool', value: 'hue-rotate(90deg)' }
                      ].map((f) => (
                        <button
                          key={f.name}
                          onClick={() => setSelectedFilter(f.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            selectedFilter === f.value 
                              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                              : 'bg-white/5 text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {f.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-4 pb-8 px-8">
                  <button
                    onClick={handleSaveProfileImage}
                    className="w-full py-4 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    Save
                  </button>
                  <button
                    onClick={() => setEditingProfileImage(null)}
                    className="w-full py-4 rounded-2xl bg-white/5 text-gray-400 font-bold hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
