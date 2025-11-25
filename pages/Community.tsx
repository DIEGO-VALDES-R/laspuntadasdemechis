
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Post } from '../types';
import { Heart, MessageCircle, Share2, X, Tag, Plus, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ImageUploader from '../components/ImageUploader';

const TOPICS = [
  'Exhibición',
  'Consejos',
  'Patrones',
  'Preguntas',
  'Evento',
  'Reseña'
];

const Community: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  // New Post State
  const [newPostImage, setNewPostImage] = useState<string>('');
  const [newPostDesc, setNewPostDesc] = useState('');
  const [newPostTopic, setNewPostTopic] = useState('Exhibición');
  
  // Custom Topic State
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [customTopic, setCustomTopic] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const data = await db.getPosts();
        setPosts(data);
      } finally {
        setLoading(false);
      }
    };
    fetchPosts();
    const user = localStorage.getItem('puntadas_user');
    setCurrentUser(user);
  }, []);

  const handleLike = async (postId: string) => {
    if (!currentUser) {
      alert("Inicia sesión para dar 'me gusta'");
      return;
    }
    const updated = await db.toggleLikePost(postId, currentUser);
    setPosts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newPostImage || !newPostDesc) return;
    
    const finalTopic = isCustomTopic ? (customTopic.trim() || 'General') : newPostTopic;

    // In a real app, we'd fetch user profile to get proper name/avatar
    const userProfile = db.getClient(); // This gets current logged in user details from mock
    const userName = currentUser === userProfile.email ? userProfile.nombre_completo : currentUser?.split('@')[0] || 'Usuario';

    const newPost: Post = {
      id: `post-${Date.now()}`, // ID will be ignored by supabase insert, generated there
      userId: currentUser || 'anon',
      userName: userName,
      userAvatar: `https://ui-avatars.com/api/?name=${userName}&background=random`,
      imageUrl: newPostImage,
      description: newPostDesc,
      topic: finalTopic,
      likes: 0,
      likedBy: [],
      timestamp: 'Justo ahora'
    };

    try {
        await db.addPost(newPost);
        // Refresh feed
        const updated = await db.getPosts();
        setPosts(updated);
        setIsModalOpen(false);
        // Reset form
        setNewPostImage('');
        setNewPostDesc('');
        setNewPostTopic('Exhibición');
        setIsCustomTopic(false);
        setCustomTopic('');
    } catch (error) {
        alert("No se pudo publicar. Intenta de nuevo.");
    }
  };

  const openCreateModal = () => {
    if(!currentUser) {
        navigate('/login');
        return;
    }
    setIsModalOpen(true);
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-pink-500" size={40}/></div>
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero */}
      <div className="bg-pink-600 text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">Comunidad Tejedora</h1>
        <p className="opacity-90 max-w-xl mx-auto mb-6">Comparte tus creaciones, inspírate con otros y celebra el arte del amigurumi.</p>
        
        <button 
          onClick={openCreateModal}
          className="bg-white text-pink-600 px-6 py-3 rounded-full font-bold shadow-lg hover:bg-pink-50 transition transform hover:-translate-y-1 inline-flex items-center gap-2"
        >
          <Plus size={20} /> Agregar Publicación
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-8">
        
        {/* Feed */}
        <div className="space-y-6">
          {posts.map(post => {
            const isLiked = currentUser && post.likedBy.includes(currentUser);
            
            return (
              <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in relative">
                {/* Header */}
                <div className="p-4 flex items-center gap-3">
                  <img src={post.userAvatar || 'https://via.placeholder.com/40'} alt="avatar" className="w-10 h-10 rounded-full"/>
                  <div>
                    <h3 className="font-bold text-gray-900">{post.userName}</h3>
                    <p className="text-xs text-gray-500">{post.timestamp}</p>
                  </div>
                  {post.topic && (
                      <span className="ml-auto text-xs font-bold bg-pink-50 text-pink-600 px-2 py-1 rounded-full">
                          {post.topic}
                      </span>
                  )}
                </div>

                {/* Image */}
                <img src={post.imageUrl} alt="post" className="w-full h-auto max-h-[500px] object-cover"/>

                {/* Actions */}
                <div className="p-4">
                  <div className="flex gap-4 mb-3">
                    <button 
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-1 transition ${isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'}`}
                    >
                      <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                    </button>
                    <button className="text-gray-600 hover:text-blue-500">
                      <MessageCircle size={24} />
                    </button>
                    <button className="text-gray-600 hover:text-green-500 ml-auto">
                      <Share2 size={24} />
                    </button>
                  </div>
                  
                  <div className="mb-2">
                    <span className="font-bold text-gray-900">{post.likes} Me gusta</span>
                  </div>

                  <p className="text-gray-800">
                    <span className="font-bold mr-2">{post.userName}</span>
                    {post.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-xl">Crear Publicación</h3>
               <button onClick={() => setIsModalOpen(false)}><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <ImageUploader 
                  currentImage={newPostImage}
                  onUpload={setNewPostImage}
                  label="Sube una foto"
                />
              </div>

              <div className="mb-4">
                  <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                      <Tag size={16}/> Tema de la publicación
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                      {TOPICS.map(topic => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => { setNewPostTopic(topic); setIsCustomTopic(false); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${!isCustomTopic && newPostTopic === topic ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                          >
                              {topic}
                          </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => { setIsCustomTopic(true); setNewPostTopic(''); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${isCustomTopic ? 'bg-pink-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                          + Otro
                      </button>
                  </div>
                  {isCustomTopic && (
                      <input 
                        type="text" 
                        placeholder="Escribe tu tema personalizado..." 
                        className="w-full border p-2 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-pink-500 outline-none"
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        required={isCustomTopic}
                      />
                  )}
              </div>

              <textarea 
                className="w-full border p-3 rounded-xl mb-4 focus:ring-2 focus:ring-pink-500 outline-none" 
                placeholder="Escribe un pie de foto..."
                rows={3}
                value={newPostDesc}
                onChange={e => setNewPostDesc(e.target.value)}
              ></textarea>

              <button 
                type="submit" 
                disabled={!newPostImage || !newPostDesc}
                className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publicar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Community;
