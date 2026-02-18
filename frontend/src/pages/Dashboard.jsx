import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { resumeAPI } from "../services/api";

function Dashboard() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const navigate = useNavigate();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user")) || {};
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) navigate("/login");
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      const res = await resumeAPI.getAll();
      setResumes(res.data || []);
    } catch (err) {
      setError("Failed to load resumes");
    } finally {
      setLoading(false);
    }
  };

  const createNewResume = async () => {
    try {
      const res = await resumeAPI.create({
        title: "Untitled Resume",
        template_id: "modern",
        resume_data: {},
      });
      navigate(`/editor/${res.data.id}`);
    } catch {
      setError("Failed to create resume");
    }
  };

  const deleteResume = async (id) => {
    if (!confirm("Delete this resume?")) return;
    try {
      await resumeAPI.delete(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      setError("Delete failed");
    }
  };

  const duplicateResume = async (resume) => {
    try {
      const res = await resumeAPI.create({
        ...resume,
        title: resume.title + " Copy",
      });
      setResumes((prev) => [res.data, ...prev]);
    } catch {
      setError("Duplicate failed");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  const filtered = resumes
    .filter((r) =>
      r.title.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sort === "updated"
        ? new Date(b.updated_at) - new Date(a.updated_at)
        : a.title.localeCompare(b.title)
    );

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* Sidebar */}
      <aside className="w-60 bg-white shadow-md p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-6">Dashboard</h2>
        <button
          onClick={createNewResume}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mb-4"
        >
          + New Resume
        </button>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-600 hover:text-black"
        >
          Logout
        </button>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">

        {/* Header */}
        <div className="flex flex-wrap gap-4 justify-between mb-6">
          <h1 className="text-2xl font-bold">Hello, {user.name}</h1>

          <div className="flex gap-3">
            <input
              placeholder="Search resumes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border px-3 py-2 rounded"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border px-3 py-2 rounded"
            >
              <option value="updated">Last updated</option>
              <option value="name">Name</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array(6)
              .fill()
              .map((_, i) => (
                <div
                  key={i}
                  className="h-32 bg-gray-200 animate-pulse rounded"
                />
              ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-white rounded shadow">
            <p>No resumes found</p>
            <button
              onClick={createNewResume}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
            >
              Create one
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((resume) => (
              <div
                key={resume.id}
                className="bg-white rounded shadow hover:shadow-lg transition p-6"
              >
                <div className="h-2 bg-blue-500 rounded mb-3" />
                <h3 className="font-semibold text-lg">{resume.title}</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Updated {new Date(resume.updated_at).toLocaleDateString()}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/editor/${resume.id}`)}
                    className="flex-1 bg-blue-50 text-blue-600 py-2 rounded"
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => duplicateResume(resume)}
                    className="px-3 bg-gray-100 rounded"
                  >
                    Copy
                  </button>

                  <button
                    onClick={() => deleteResume(resume.id)}
                    className="px-3 bg-red-100 text-red-600 rounded"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
