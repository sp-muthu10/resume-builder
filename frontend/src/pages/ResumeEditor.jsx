import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resumeAPI } from '../services/api';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function ResumeEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [resume, setResume] = useState({
    title: '',
    template_id: 'modern',
    resume_data: {
      personalInfo: {
        fullName: '', email: '', phone: '',
        location: '', linkedin: '', summary: ''
      },
      workExperience: [],
      education: [],
      skills: []
    }
  });
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState('personal');

  useEffect(() => {
    if (id) loadResume();
  }, [id]);

  const loadResume = async () => {
    try {
      const response = await resumeAPI.getOne(id);
      const data = response.data;

      // Parse resume_data if it comes as a string
      if (typeof data.resume_data === 'string') {
        data.resume_data = JSON.parse(data.resume_data);
      }

      // Make sure all fields exist
      data.resume_data = {
        personalInfo: {
          fullName: '', email: '', phone: '',
          location: '', linkedin: '', summary: '',
          ...data.resume_data.personalInfo
        },
        workExperience: data.resume_data.workExperience || [],
        education: data.resume_data.education || [],
        skills: data.resume_data.skills || [],
      };

      setResume(data);
    } catch (error) {
      console.error('Error loading resume:', error);
    }
  };

  const saveResume = async () => {
    setSaving(true);
    try {
      await resumeAPI.update(id, resume);
      alert('Resume saved successfully!');
    } catch (error) {
      console.error('Error saving resume:', error);
      alert('Failed to save resume');
    } finally {
      setSaving(false);
    }
  };

  const updatePersonalInfo = (field, value) => {
    setResume({
      ...resume,
      resume_data: {
        ...resume.resume_data,
        personalInfo: { ...resume.resume_data.personalInfo, [field]: value }
      }
    });
  };

  const addWorkExperience = () => {
    setResume({
      ...resume,
      resume_data: {
        ...resume.resume_data,
        workExperience: [
          ...resume.resume_data.workExperience,
          { id: Date.now(), company: '', position: '', startDate: '', endDate: '', current: false, description: '' }
        ]
      }
    });
  };

  const updateWorkExperience = (index, field, value) => {
    const updated = [...resume.resume_data.workExperience];
    updated[index] = { ...updated[index], [field]: value };
    setResume({ ...resume, resume_data: { ...resume.resume_data, workExperience: updated } });
  };

  const removeWorkExperience = (index) => {
    setResume({
      ...resume,
      resume_data: {
        ...resume.resume_data,
        workExperience: resume.resume_data.workExperience.filter((_, i) => i !== index)
      }
    });
  };

  const addEducation = () => {
    setResume({
      ...resume,
      resume_data: {
        ...resume.resume_data,
        education: [
          ...resume.resume_data.education,
          { id: Date.now(), school: '', degree: '', field: '', startDate: '', endDate: '' }
        ]
      }
    });
  };

  const updateEducation = (index, field, value) => {
    const updated = [...resume.resume_data.education];
    updated[index] = { ...updated[index], [field]: value };
    setResume({ ...resume, resume_data: { ...resume.resume_data, education: updated } });
  };

  const removeEducation = (index) => {
    setResume({
      ...resume,
      resume_data: {
        ...resume.resume_data,
        education: resume.resume_data.education.filter((_, i) => i !== index)
      }
    });
  };

  const addSkill = () => {
    const skill = prompt('Enter a skill:');
    if (skill) {
      setResume({
        ...resume,
        resume_data: {
          ...resume.resume_data,
          skills: [...resume.resume_data.skills, skill]
        }
      });
    }
  };

  const removeSkill = (index) => {
    setResume({
      ...resume,
      resume_data: {
        ...resume.resume_data,
        skills: resume.resume_data.skills.filter((_, i) => i !== index)
      }
    });
  };

  const downloadPDF = async () => {
    const element = document.getElementById('resume-preview');
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${resume.title || 'resume'}.pdf`);
  };

  const { personalInfo, workExperience, education, skills } = resume.resume_data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/dashboard')} className="text-gray-600 hover:text-gray-900">
              ← Back
            </button>
            <input
              type="text"
              value={resume.title}
              onChange={(e) => setResume({ ...resume, title: e.target.value })}
              className="text-xl font-semibold border-0 border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <button onClick={saveResume} disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition disabled:bg-gray-400">
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={downloadPDF}
              className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition">
              Download PDF
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex gap-2 mb-6 border-b">
              {['personal', 'experience', 'education', 'skills'].map((section) => (
                <button key={section} onClick={() => setActiveSection(section)}
                  className={`px-4 py-2 font-medium capitalize ${
                    activeSection === section ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600'
                  }`}>
                  {section}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {activeSection === 'personal' && (
                <>
                  <input type="text" placeholder="Full Name" value={personalInfo.fullName}
                    onChange={(e) => updatePersonalInfo('fullName', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md" />
                  <input type="email" placeholder="Email" value={personalInfo.email}
                    onChange={(e) => updatePersonalInfo('email', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md" />
                  <input type="tel" placeholder="Phone" value={personalInfo.phone}
                    onChange={(e) => updatePersonalInfo('phone', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md" />
                  <input type="text" placeholder="Location" value={personalInfo.location}
                    onChange={(e) => updatePersonalInfo('location', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md" />
                  <input type="text" placeholder="LinkedIn" value={personalInfo.linkedin}
                    onChange={(e) => updatePersonalInfo('linkedin', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md" />
                  <textarea placeholder="Professional Summary" value={personalInfo.summary}
                    onChange={(e) => updatePersonalInfo('summary', e.target.value)}
                    className="w-full px-4 py-2 border rounded-md h-32" />
                </>
              )}

              {activeSection === 'experience' && (
                <>
                  {workExperience.map((exp, index) => (
                    <div key={exp.id} className="border p-4 rounded-md space-y-2">
                      <input type="text" placeholder="Company" value={exp.company}
                        onChange={(e) => updateWorkExperience(index, 'company', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md" />
                      <input type="text" placeholder="Position" value={exp.position}
                        onChange={(e) => updateWorkExperience(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="month" value={exp.startDate}
                          onChange={(e) => updateWorkExperience(index, 'startDate', e.target.value)}
                          className="px-3 py-2 border rounded-md" />
                        <input type="month" value={exp.endDate}
                          onChange={(e) => updateWorkExperience(index, 'endDate', e.target.value)}
                          className="px-3 py-2 border rounded-md" disabled={exp.current} />
                      </div>
                      <label className="flex items-center gap-2">
                        <input type="checkbox" checked={exp.current}
                          onChange={(e) => updateWorkExperience(index, 'current', e.target.checked)} />
                        <span className="text-sm">Currently working here</span>
                      </label>
                      <textarea placeholder="Description" value={exp.description}
                        onChange={(e) => updateWorkExperience(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md h-24" />
                      <button onClick={() => removeWorkExperience(index)}
                        className="text-red-600 text-sm hover:underline">Remove</button>
                    </div>
                  ))}
                  <button onClick={addWorkExperience}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600">
                    + Add Experience
                  </button>
                </>
              )}

              {activeSection === 'education' && (
                <>
                  {education.map((edu, index) => (
                    <div key={edu.id} className="border p-4 rounded-md space-y-2">
                      <input type="text" placeholder="School" value={edu.school}
                        onChange={(e) => updateEducation(index, 'school', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md" />
                      <input type="text" placeholder="Degree" value={edu.degree}
                        onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md" />
                      <input type="text" placeholder="Field of Study" value={edu.field}
                        onChange={(e) => updateEducation(index, 'field', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md" />
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Start Year" value={edu.startDate}
                          onChange={(e) => updateEducation(index, 'startDate', e.target.value)}
                          className="px-3 py-2 border rounded-md" />
                        <input type="text" placeholder="End Year" value={edu.endDate}
                          onChange={(e) => updateEducation(index, 'endDate', e.target.value)}
                          className="px-3 py-2 border rounded-md" />
                      </div>
                      <button onClick={() => removeEducation(index)}
                        className="text-red-600 text-sm hover:underline">Remove</button>
                    </div>
                  ))}
                  <button onClick={addEducation}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600">
                    + Add Education
                  </button>
                </>
              )}

              {activeSection === 'skills' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                        {skill}
                        <button onClick={() => removeSkill(index)}
                          className="text-blue-600 hover:text-blue-800">×</button>
                      </span>
                    ))}
                  </div>
                  <button onClick={addSkill}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-md text-gray-600 hover:border-blue-500 hover:text-blue-600">
                    + Add Skill
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-8" id="resume-preview">
            <div className="space-y-6">
              <div className="text-center border-b-2 pb-4">
                <h1 className="text-3xl font-bold text-gray-900">{personalInfo.fullName || 'Your Name'}</h1>
                <div className="text-sm text-gray-600 mt-2 space-x-3">
                  {personalInfo.email && <span>{personalInfo.email}</span>}
                  {personalInfo.phone && <span>• {personalInfo.phone}</span>}
                  {personalInfo.location && <span>• {personalInfo.location}</span>}
                </div>
                {personalInfo.linkedin && (
                  <div className="text-sm text-blue-600 mt-1">{personalInfo.linkedin}</div>
                )}
              </div>

              {personalInfo.summary && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Professional Summary</h2>
                  <p className="text-gray-700 text-sm">{personalInfo.summary}</p>
                </div>
              )}

              {workExperience.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Work Experience</h2>
                  {workExperience.map((exp) => (
                    <div key={exp.id} className="mb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{exp.position}</h3>
                          <p className="text-gray-700">{exp.company}</p>
                        </div>
                        <span className="text-sm text-gray-600">
                          {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                        </span>
                      </div>
                      {exp.description && (
                        <p className="text-sm text-gray-700 mt-2">{exp.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {education.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-3">Education</h2>
                  {education.map((edu) => (
                    <div key={edu.id} className="mb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{edu.degree} in {edu.field}</h3>
                          <p className="text-gray-700">{edu.school}</p>
                        </div>
                        <span className="text-sm text-gray-600">{edu.startDate} - {edu.endDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {skills.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill, index) => (
                      <span key={index} className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ResumeEditor;
