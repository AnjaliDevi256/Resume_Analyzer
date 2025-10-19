// 1. ENVIRONMENT SETUP
require('dotenv').config();
var path = require('path');

// Import required modules
var express = require('express');
var mongoose = require('mongoose');
var cors = require('cors');
var multer = require('multer');
var fs = require('fs');
var pdfParse = require('pdf-parse');
var Resume = require('./models/resume'); 

// Initialize Express
var app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://fallback:uri")
  .then(function() { console.log("Connected to MongoDB Atlas"); })
  .catch(function(err) { console.log("DB Error:", err); });

// Multer setup for file upload
var storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads/'); 
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath);
    }
    cb(null, uploadPath); 
  },
  filename: function(req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); 
  }
});

var upload = multer({ storage: storage });

// Helper function to generate dynamic feedback based on score
function generateFeedback(score, missingSkills) {
    if (score >= 80) {
        return "Excellent match! Your skills align strongly with the required keywords for this role.";
    } else if (score >= 60) {
        return "Good potential. Your profile shows good alignment. Consider highlighting more relevant skills.";
    } else if (score >= 40) {
        return "Basic alignment. You meet some core requirements. Focus on bridging the skill gaps.";
    } else {
        return "Low match. A significant gap exists between your resume and the target role's requirements.";
    }
}

// Home route (Default check - will be overwritten in production)
app.get('/', function(req, res) {
  res.send('<h2>Resume Analyzer Backend Running</h2>');
});

// Upload & analyze resume route
app.post('/api/upload', upload.single('resume'), async function(req, res) {
  try {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }
    
    // 1. Read and Parse PDF
    var dataBuffer = fs.readFileSync(req.file.path);
    var data = await pdfParse(dataBuffer);
    var text = data.text.toLowerCase();
    
    // Clean up the uploaded file immediately
    fs.unlink(req.file.path, (err) => {
        if (err) console.error("Failed to delete temp file:", err);
    });

    // 2. Determine Role and Keywords
    var role = req.body.role || 'fullstack';
    var roleDisplay = role.replace(/([a-z])([A-Z])/g, '$1 $2').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    
    var keywords = [];

    if (role === 'fullstack') {
      keywords = ['python', 'javascript', 'react', 'node', 'sql', 'mongodb', 'typescript', 'aws'];
    } else if (role === 'datascientist') {
      keywords = ['python', 'pandas', 'numpy', 'machine learning', 'sql', 'tensorflow', 'r', 'statistics'];
    } else if (role === 'frontend') {
      keywords = ['javascript', 'react', 'html', 'css', 'redux', 'typescript', 'tailwind', 'webpack'];
    } else if (role === 'backend') {
      keywords = ['node', 'express', 'mongodb', 'sql', 'api', 'docker', 'java', 'go'];
    }

    // 3. Calculate Score
    var score = 0;
    var presentSkills = [];
    var missingSkills = [];
    
    const pointsPerKeyword = 100 / keywords.length;

    for (var i = 0; i < keywords.length; i++) {
      if (text.includes(keywords[i])) { 
        score += pointsPerKeyword;
        presentSkills.push(keywords[i]);
      } else {
        missingSkills.push(keywords[i]);
      }
    }

    score = Math.round(score);

    // 4. Save result to MongoDB
    var newResume = new Resume({
      filename: req.file.filename,
      score: score,
      uploadedAt: new Date(),
      role: role
    });

    await newResume.save();

    // 5. Generate Styled HTML Response (Remains the same styled content)
    var feedback = generateFeedback(score, missingSkills);
    var filenameDisplay = req.file.originalname;

    const skillsFoundList = presentSkills.map(s => 
        `<span style="background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 3px; margin: 3px; display: inline-block; font-size: 0.9em; font-weight: 500;">${s}</span>`
    ).join('');
    
    const skillsMissingList = missingSkills.map(s => 
        `<span style="background-color: #f8d7da; color: #721c24; padding: 4px 8px; border-radius: 3px; margin: 3px; display: inline-block; font-size: 0.9em; font-weight: 500;">${s}</span>`
    ).join('');
    
    var htmlResponse = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Analysis Results</title>
            <style>
                body {
                    font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    background-color: #f8f9fa;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                    margin: 0;
                    color: #343a40;
                }
                .results-card {
                    width: 90%;
                    max-width: 800px;
                    background: #ffffff;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    padding: 30px;
                    border: 1px solid #e9ecef;
                }
                .header {
                    display: flex;
                    align-items: center;
                    margin-bottom: 20px;
                }
                .header .icon {
                    font-size: 1.5rem;
                    color: #007bff;
                    margin-right: 15px;
                }
                .header .title-group h1 {
                    font-size: 1.8rem;
                    font-weight: 600;
                    margin: 0;
                    line-height: 1.2;
                }
                .header .title-group p {
                    font-size: 1rem;
                    color: #6c757d;
                    margin: 0;
                }
                .score-section {
                    text-align: center;
                    margin: 30px 0;
                }
                .score-value {
                    font-size: 4.5rem;
                    font-weight: 700;
                    color: #007bff;
                    display: inline-block;
                    line-height: 1;
                }
                .score-value span {
                    font-size: 2rem;
                    font-weight: 400;
                    color: #6c757d;
                    vertical-align: top;
                    margin-left: 5px;
                }
                .filename {
                    color: #6c757d;
                    margin-top: 5px;
                    font-size: 1.1rem;
                }
                .match-label {
                    font-weight: 500;
                    margin-top: 20px;
                    display: block;
                }
                .progress-bar-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 30px;
                }
                .progress-bar {
                    flex-grow: 1;
                    height: 10px;
                    background-color: #e9ecef;
                    border-radius: 5px;
                    margin-right: 10px;
                    overflow: hidden;
                }
                .progress-fill {
                    height: 100%;
                    width: ${score}%;
                    background-color: #007bff;
                    transition: width 0.5s ease-in-out;
                }
                .match-percentage {
                    font-weight: 600;
                    color: #343a40;
                }
                .feedback-box {
                    padding: 20px;
                    background-color: #f8f9fa;
                    border: 1px solid #e9ecef;
                    border-radius: 6px;
                }
                .feedback-box h3 {
                    font-size: 1.2rem;
                    color: #343a40;
                    margin-top: 0;
                    margin-bottom: 10px;
                    font-weight: 600;
                }
                .feedback-box p {
                    color: #495057;
                    line-height: 1.5;
                }
                .skill-list-section {
                    margin-top: 20px;
                    padding-top: 15px;
                    border-top: 1px dashed #ced4da;
                }
                .skill-list-section h4 {
                    font-size: 1rem;
                    margin-bottom: 8px;
                    color: #343a40;
                    font-weight: 600;
                }
                .home-link {
                    display: block;
                    width: 100%;
                    margin-top: 30px;
                    text-align: center;
                    text-decoration: none;
                    font-weight: 600;
                    padding: 12px 15px;
                    border: none;
                    border-radius: 4px;
                    background-color: #6699cc; 
                    color: #ffffff;
                    transition: background-color 0.2s;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
                .home-link:hover {
                    background-color: #5588bb;
                }
            </style>
        </head>
        <body>
            <div class="results-card">
                <div class="header">
                    <span class="icon">&#9432;</span> 
                    <div class="title-group">
                        <h1>Analysis Results</h1>
                        <p>Score for ${roleDisplay}</p>
                    </div>
                </div>

                <div class="score-section">
                    <div class="score-value">
                        ${score}<span>/100</span>
                    </div>
                    <p class="filename">${filenameDisplay}</p>
                </div>

                <span class="match-label">Match Score</span>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <span class="match-percentage">${score}%</span>
                </div>

                <div class="feedback-box">
                    <h3>Feedback</h3>
                    <p>${feedback}</p>
                    
                    <div class="skill-list-section">
                        <h4>Skills Found (${presentSkills.length}/${keywords.length})</h4>
                        <p style="margin: 5px 0;">
                            ${skillsFoundList || '<span style="color:#777;">No relevant keywords found.</span>'}
                        </p>
                    </div>

                    <div class="skill-list-section">
                        <h4>Skills Missing (${missingSkills.length}/${keywords.length})</h4>
                        <p style="margin: 5px 0;">
                            ${skillsMissingList || '<span style="color:#777;">All target keywords found!</span>'}
                        </p>
                    </div>
                </div>
                
                <a href="/" class="home-link">Upload Another Resume</a>
            </div>
        </body>
        </html>
    `;

    res.send(htmlResponse);

  } catch (err) {
    console.error("Error processing resume:", err);
    res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
            <h1>&#9888; Analysis Failed</h1>
            <p>There was an error processing the file. Check if the file is a valid PDF/DOCX or if the MongoDB connection is active.</p>
            <a href="/">Go back to Upload Form</a>
            <p style="font-size: 0.8em; color: #aaa;">Error Details: ${err.message}</p>
        </body>
        </html>
    `);
  }
});

// --- STATIC FILE SERVING LOGIC (FOR RENDER DEPLOYMENT) ---
if (process.env.NODE_ENV === 'production') {
    // 1. Serve the static assets (JS, CSS, images) from the built React app
    app.use(express.static(path.resolve(__dirname, '..', 'frontend', 'build')));

    // 2. For any other GET request (like the homepage '/'), send the React index.html
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '..', 'frontend', 'build', 'index.html'));
    });
}
// -------------------------------------

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, function() {
  console.log('Server running on port ' + PORT);
});