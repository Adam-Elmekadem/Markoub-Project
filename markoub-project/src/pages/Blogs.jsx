import { useEffect, useState } from 'react';
import { Spinner } from '../components/Spinner';
import { Calendar, User, Clock, Tag } from 'lucide-react';
import { BlogsAPI } from '../utils/api';

export const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setIsLoading(true);
      try {
        const res = await BlogsAPI.list();
        const items = Array.isArray(res?.data) ? res.data : res;
        const normalized = (items || []).map((b) => ({
          id: b.id,
          title: b.title,
          author: b.author?.first_name ? `${b.author.first_name} ${b.author.last_name || ''}`.trim() : (b.author || 'Unknown'),
          date: b.published_at?.slice(0, 10) || b.created_at?.slice(0, 10) || '',
          readTime: '5 min read',
          category: b.category || 'General',
          image: b.featured_image || 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=1600&auto=format&fit=crop',
          status: b.status || 'published',
          content: b.content || '',
          slug: b.slug || b.id,
        }));
        if (!active) return;
        setBlogs(normalized);
        setSelectedBlog(normalized[0] || null);
      } catch (e) {
        // fallback to empty
        setBlogs([]);
        setSelectedBlog(null);
        setError(e?.message || 'Failed to load blogs');
      } finally {
        setIsLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          <Spinner className="w-12 h-12 mx-auto mb-4" />
          <p className="text-slate-600">Loading blogs...</p>
        </div>
      </div>
    );
  }

  if (!selectedBlog && blogs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20 flex items-center justify-center">
        <div className="text-center">
          {error ? (
            <>
              <h1 className="text-2xl font-bold text-red-600 mb-2">Failed to load blogs</h1>
              <p className="text-slate-600">{error}</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">No blogs available</h1>
              <p className="text-slate-600">Check back soon for new posts!</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900">MARKOUB Blog</h1>
          <p className="text-slate-600 mt-2 text-lg">Stories, tips, and insights from our community</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-1/3 xl:w-1/4">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
              <h2 className="text-xl font-bold text-slate-900 mb-4">All Posts</h2>
              <div className="space-y-3">
                {blogs.map((blog) => (
                  <div
                    key={blog.id}
                    onClick={() => setSelectedBlog(blog)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedBlog?.id === blog.id
                        ? 'bg-blue-700 text-white shadow-md'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-900'
                    }`}
                  >
                    <h3 className={`font-semibold text-sm mb-2 ${
                      selectedBlog?.id === blog.id ? 'text-white' : 'text-slate-900'
                    }`}>
                      {blog.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs">
                      <span className={`flex items-center gap-1 ${
                        selectedBlog?.id === blog.id ? 'text-white/80' : 'text-slate-600'
                      }`}>
                        <Calendar className="w-3 h-3" />
                        {blog.date}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        selectedBlog?.id === blog.id 
                          ? 'bg-white/20 text-white' 
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {blog.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:w-2/3 xl:w-3/4">
            <article className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Featured Image */}
              <div className="relative h-64 md:h-96 overflow-hidden">
                <img
                  src={selectedBlog?.image}
                  alt={selectedBlog.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 to-transparent"></div>
              </div>

              {/* Content */}
              <div className="p-6 md:p-10">
                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                  <span className="flex items-center gap-2 text-slate-600">
                    <User className="w-4 h-4" />
                    {selectedBlog?.author}
                  </span>
                  <span className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-4 h-4" />
                    {selectedBlog?.date}
                  </span>
                  <span className="flex items-center gap-2 text-slate-600">
                    <Clock className="w-4 h-4" />
                    {selectedBlog?.readTime}
                  </span>
                  <span className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <Tag className="w-4 h-4" />
                    {selectedBlog?.category}
                  </span>
                </div>

                {/* Title */}
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-6">
                  {selectedBlog?.title}
                </h1>

                {/* Blog Content */}
                <div
                  className="prose prose-slate max-w-none prose-h2:text-3xl prose-h2:font-extrabold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-2xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-p:mt-4 blog-content"
                  dangerouslySetInnerHTML={{ __html: selectedBlog?.content || '' }}
                />

                {/* Share Section */}
                <div className="mt-12 pt-6 border-t border-slate-200">
                  <p className="text-slate-600 text-sm">
                    Found this helpful? Share your thoughts or experiences with the MARKOUB community!
                  </p>
                </div>
              </div>
            </article>
          </main>
        </div>
      </div>
    </div>
  );
};
