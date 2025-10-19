import './App.css'
import React from 'react';
function UploadForm() {
  // Function to simulate clicking the hidden file input
  const handleDropzoneClick = () => {
    document.getElementById('resume-file-input').click();
  };

  return (
    <div className="upload-container">
      {/* Add the logo/header structure if desired, but we'll focus on the form body */}
      
      <h2>Upload Resume</h2>
      <p className="subtitle">
        Select your resume and choose the target role for analysis
      </p>

      <form 
        className="upload-form"
        action="/api/upload" 
        method="POST" 
        encType="multipart/form-data"
      >
        {/* ======================= Target Role Select ======================= */}
        <label htmlFor="role-select">Target Role</label>
        <select name="role" id="role-select" required>
          <option value="">Select a role</option> {/* Placeholder option */}
          <option value="fullstack">Fullstack Developer</option>
          <option value="frontend">Frontend Developer</option>
          <option value="backend">Backend Developer</option>
          <option value="datascientist">Data Scientist</option>
        </select>

        {/* ======================= Resume File Dropzone ======================= */}
        <label>Resume File</label>
        
        {/* The hidden actual file input */}
        <input 
          type="file" 
          name="resume" 
          accept=".pdf,.doc,.docx" 
          required 
          id="resume-file-input" // ID to be referenced by the click handler
        />

        {/* The visible dropzone area */}
        <div className="file-dropzone" onClick={handleDropzoneClick}>
          {/* Using a text placeholder for the icon (⬆️) - replace with a real SVG/Icon */}
          <div className="upload-icon">⬆️</div> 
          <p>Click to upload resume</p>
          <p className="size-limit">PDF or Word document (max 5MB)</p>
        </div>

        {/* ======================= Submit Button ======================= */}
        <button type="submit">
          {/* Using a text placeholder for the icon (📄) - replace with a real SVG/Icon */}
          <span className="button-icon">📄</span> 
          Analyze Resume
        </button>
      </form>
    </div>
  );
}

export default UploadForm;
