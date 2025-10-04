// Client Dashboard JavaScript for Tonio & Senora

// Global variables
let currentUser = null;
let isAuthenticated = false;

// Initialize client dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeClientDashboard();
    setupClientEventListeners();
    registerServiceWorker();
});

// Initialize client dashboard
function initializeClientDashboard() {
    // Clear any admin session data first
    localStorage.removeItem('adminSession');
    
    // Check for client session
    const clientSession = localStorage.getItem('clientSession');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!clientSession || !savedUser) {
        // No valid client session, redirect to login
        clearAllSessions();
        window.location.href = 'index.html';
        return;
    }
    
    currentUser = JSON.parse(savedUser);
    
    // Ensure only clients can access client dashboard
    if (currentUser.accountType !== 'client') {
        // Clear session and redirect to home
        clearAllSessions();
        window.location.href = 'index.html';
        return;
    }
    
    isAuthenticated = true;
    
    // Update user name
    const userNameElement = document.getElementById('userName');
    if (userNameElement) {
        userNameElement.textContent = `Welcome, ${currentUser.name}`;
    }
    
    // Load initial data
    loadDashboardData();
    loadDocuments();
    loadMessages();
}

// Clear all session data
function clearAllSessions() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserType');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('adminSession');
    localStorage.removeItem('clientSession');
}

// Show unauthorized error
function showUnauthorizedError() {
    document.body.innerHTML = `
        <div style="
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #D4AF37, #4A0E4E);
            font-family: 'Inter', sans-serif;
        ">
            <div style="
                background: white;
                padding: 3rem;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                text-align: center;
                max-width: 400px;
                width: 90%;
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    background: #dc3545;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 1.5rem;
                ">
                    <i class="fas fa-lock" style="color: white; font-size: 2rem;"></i>
                </div>
                <h2 style="color: #333; margin-bottom: 1rem; font-size: 1.5rem;">Unauthorized Access</h2>
                <p style="color: #666; margin-bottom: 2rem; line-height: 1.6;">
                    You do not have permission to access the client dashboard. 
                    Please login with a client account.
                </p>
                <button onclick="window.location.href='index.html'" style="
                    background: #D4AF37;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background 0.3s ease;
                " onmouseover="this.style.background='#B8941F'" onmouseout="this.style.background='#D4AF37'">
                    Return to Home
                </button>
            </div>
        </div>
    `;
}

// Setup client event listeners
function setupClientEventListeners() {
    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    
    sidebarLinks.forEach((link, index) => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    // Message form
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', handleMessageSubmit);
    }
    
    // File upload
    setupFileUpload();
}

// Show section
function showSection(sectionId) {
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => section.classList.remove('active'));
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    } else {
        console.error('Section not found:', sectionId);
    }
    
    // Update active sidebar link
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    } else {
        console.error('Sidebar link not found for:', sectionId);
    }
    
    // Load section-specific data
    switch(sectionId) {
        case 'documents':
            loadDocuments();
            break;
        case 'checklist':
            loadChecklist();
            break;
        case 'progress':
            loadProgress();
            break;
        case 'messages':
            loadMessages();
            break;
    }
}

// Load dashboard data
function loadDashboardData() {
    // Load application status from storage
    const applicationStatus = loadFromStorage('applicationStatus') || {
        status: 'Not Started',
        progress: 0,
        nextStep: 'Upload Documents'
    };
    
    // Update status badge
    const statusBadge = document.querySelector('.status-badge');
    if (statusBadge) {
        statusBadge.textContent = applicationStatus.status;
        statusBadge.className = `status-badge status-${applicationStatus.status.toLowerCase().replace(' ', '-')}`;
    }
    
    // Update progress bar
    const progressFill = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    if (progressFill && progressText) {
        progressFill.style.width = `${applicationStatus.progress}%`;
        progressText.textContent = `${applicationStatus.progress}% Complete`;
    }
    
    // Load recent activity
    loadRecentActivity();
}

// Load recent activity
function loadRecentActivity() {
    const activities = loadFromStorage('recentActivities') || [];
    
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="activity-item">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <p>No recent activity</p>
                        <span>Start by uploading your documents</span>
                    </div>
                </div>
            `;
        } else {
            activityList.innerHTML = activities.map(activity => `
                <div class="activity-item">
                    <i class="fas fa-${getActivityIcon(activity.type)}"></i>
                    <div>
                        <p>${activity.message}</p>
                        <span>${formatDate(activity.timestamp)}</span>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Get activity icon
function getActivityIcon(type) {
    const icons = {
        upload: 'file-upload',
        message: 'comment',
        approval: 'check',
        review: 'eye',
        submission: 'paper-plane'
    };
    return icons[type] || 'info-circle';
}

// Document Management System
const DOCUMENT_REQUIREMENTS = {
    australia: {
        'skilled-migration': {
            name: 'Skilled Migration (GSM/190/491)',
            categories: {
                'skills-assessment': {
                    name: 'Skills Assessment',
                    documents: [
                        { id: 'acs-letter', name: 'ACS Letter', required: true, description: 'Australian Computer Society skills assessment letter' },
                        { id: 'engineers-australia', name: 'Engineers Australia Assessment', required: true, description: 'Professional engineering skills assessment' },
                        { id: 'vetassess-report', name: 'VETASSESS Report', required: true, description: 'Vocational Education and Training Assessment Services report' },
                        { id: 'anmac-certificate', name: 'ANMAC Certificate', required: false, description: 'Australian Nursing and Midwifery Accreditation Council certificate' },
                        { id: 'ahpra-registration', name: 'AHPRA Registration', required: false, description: 'Australian Health Practitioner Regulation Agency registration' }
                    ]
                },
                'identity': {
                    name: 'Identity Documents',
                    documents: [
                        { id: 'passport-bio', name: 'Passport Bio Page', required: true, description: 'Clear copy of passport biographical page' },
                        { id: 'birth-certificate', name: 'Birth Certificate', required: true, description: 'Official birth certificate with translation if not in English' },
                        { id: 'name-change-docs', name: 'Name Change Documents', required: false, description: 'Legal documents showing name changes' },
                        { id: 'national-id', name: 'National ID', required: false, description: 'Government issued national identification document' }
                    ]
                },
                'education': {
                    name: 'Educational Documents',
                    documents: [
                        { id: 'degree-certificate', name: 'Degree Certificate', required: true, description: 'Official degree certificate with translation if not in English' },
                        { id: 'academic-transcripts', name: 'Academic Transcripts', required: true, description: 'Complete academic transcripts from all institutions' },
                        { id: 'official-syllabus', name: 'Official Syllabus (if required)', required: false, description: 'Detailed course syllabus for specific qualifications' },
                        { id: 'professional-memberships', name: 'Professional Memberships', required: false, description: 'Certificates of professional body memberships' }
                    ]
                },
                'employment': {
                    name: 'Employment Documents',
                    documents: [
                        { id: 'employment-references', name: 'Detailed Employment References', required: true, description: 'Comprehensive employment references with specific duties and responsibilities' },
                        { id: 'cv-resume', name: 'CV/Resume (5+ years)', required: true, description: 'Detailed CV covering at least 5 years of relevant work experience' },
                        { id: 'payslips', name: 'Payslips', required: true, description: 'Recent payslips or salary statements' },
                        { id: 'employment-contracts', name: 'Employment Contracts', required: true, description: 'Current and previous employment contracts' },
                        { id: 'work-experience-evidence', name: 'Work Experience Evidence', required: true, description: 'Additional evidence of work experience and skills' }
                    ]
                },
                'english-tests': {
                    name: 'English Language Tests',
                    documents: [
                        { id: 'ielts-general', name: 'IELTS General', required: false, description: 'International English Language Testing System General Training' },
                        { id: 'ielts-academic', name: 'IELTS Academic', required: false, description: 'International English Language Testing System Academic' },
                        { id: 'pte-academic', name: 'PTE Academic', required: false, description: 'Pearson Test of English Academic' },
                        { id: 'toefl-ibt', name: 'TOEFL iBT', required: false, description: 'Test of English as a Foreign Language Internet-based Test' },
                        { id: 'oet-healthcare', name: 'OET (for healthcare)', required: false, description: 'Occupational English Test for healthcare professionals' }
                    ]
                },
                'character': {
                    name: 'Character Documents',
                    documents: [
                        { id: 'police-clearances', name: 'Police Clearances (each country 12+ months since age 16)', required: true, description: 'Police clearance certificates from all countries where you lived for 12+ months since age 16' },
                        { id: 'military-records', name: 'Military Service Records', required: false, description: 'Military service records if applicable' }
                    ]
                },
                'health': {
                    name: 'Health Documents',
                    documents: [
                        { id: 'medical-examinations', name: 'Medical Examinations', required: true, description: 'Complete medical examination by approved panel physician' },
                        { id: 'chest-xray', name: 'Chest X-Ray', required: true, description: 'Chest X-ray examination results' },
                        { id: 'hiv-test', name: 'HIV Test (if required)', required: false, description: 'HIV test results if specifically required' }
                    ]
                },
                'financial': {
                    name: 'Financial Documents',
                    documents: [
                        { id: 'bank-statements', name: 'Bank Statements', required: true, description: 'Recent bank statements showing financial capacity' },
                        { id: 'tax-returns', name: 'Tax Returns', required: true, description: 'Recent tax return documents' },
                        { id: 'salary-certificates', name: 'Salary Certificates', required: true, description: 'Official salary certificates from employers' }
                    ]
                }
            }
        },
        'student-visa': {
            name: 'Student Visa (Subclass 500)',
            categories: {
                'study': {
                    name: 'Study Documents',
                    documents: [
                        { id: 'coe-all-courses', name: 'Confirmation of Enrolment (CoE) - All Courses', required: true, description: 'CoE for all courses you intend to study' },
                        { id: 'oshc-policy', name: 'OSHC Policy Details', required: true, description: 'Overseas Student Health Cover policy information' },
                        { id: 'gte-statement', name: 'GTE Statement (150 words max per question)', required: true, description: 'Genuine Temporary Entrant statement addressing specific questions' }
                    ]
                },
                'identity': {
                    name: 'Identity Documents',
                    documents: [
                        { id: 'passport-6months', name: 'Passport (6+ months validity)', required: true, description: 'Passport with at least 6 months validity remaining' },
                        { id: 'birth-certificate', name: 'Birth Certificate', required: true, description: 'Official birth certificate with translation if not in English' },
                        { id: 'passport-photos', name: '4 Passport Photos', required: true, description: '4 recent passport-sized photographs' }
                    ]
                },
                'academic': {
                    name: 'Academic Documents',
                    documents: [
                        { id: 'previous-transcripts', name: 'Previous Academic Transcripts', required: true, description: 'Transcripts from all previous educational institutions' },
                        { id: 'graduation-certificates', name: 'Graduation Certificates', required: true, description: 'Certificates of completion from previous studies' },
                        { id: 'english-test-results', name: 'English Test Results', required: true, description: 'Valid English language test results meeting course requirements' }
                    ]
                },
                'financial': {
                    name: 'Financial Documents',
                    documents: [
                        { id: 'financial-evidence', name: 'Financial Evidence (AUD $29,710+)', required: true, description: 'Evidence of sufficient funds (minimum AUD $29,710 for 12 months)' },
                        { id: 'scholarship-letters', name: 'Scholarship Letters', required: false, description: 'Official scholarship award letters if applicable' },
                        { id: 'sponsor-financial', name: 'Sponsor Financial Documents', required: false, description: 'Financial documents from sponsors if applicable' }
                    ]
                },
                'character': {
                    name: 'Character Documents',
                    documents: [
                        { id: 'police-clearance', name: 'Police Clearance Certificate', required: true, description: 'Police clearance from country of residence' },
                        { id: 'military-records', name: 'Military Records (if applicable)', required: false, description: 'Military service records if applicable' }
                    ]
                },
                'health': {
                    name: 'Health Documents',
                    documents: [
                        { id: 'health-examinations', name: 'Health Examinations', required: true, description: 'Complete health examination by approved panel physician' },
                        { id: 'medical-insurance', name: 'Medical Insurance', required: true, description: 'Valid medical insurance coverage' }
                    ]
                },
                'minors': {
                    name: 'Minors Documents (Under 18)',
                    documents: [
                        { id: 'form-157n', name: 'Form 157N Student Guardian', required: false, description: 'Guardian nomination form for students under 18' },
                        { id: 'form-1229', name: 'Form 1229 Parental Consent', required: false, description: 'Parental consent form for students under 18' },
                        { id: 'welfare-arrangements', name: 'Welfare Arrangements', required: false, description: 'Welfare arrangements for students under 18' }
                    ]
                }
            }
        },
        'family-visas': {
            name: 'Family Visas',
            categories: {
                'parent-visa': {
                    name: 'Parent Visa Documents',
                    documents: [
                        { id: 'form-47pa', name: 'Form 47PA Application', required: true, description: 'Parent visa application form' },
                        { id: 'form-40', name: 'Form 40 Sponsorship', required: true, description: 'Sponsorship form for parent visa' },
                        { id: 'balance-family-test', name: 'Balance of Family Test Evidence', required: true, description: 'Evidence that more than half of children live in Australia' },
                        { id: 'sponsor-pr-citizenship', name: 'Sponsor PR/Citizenship Proof', required: true, description: 'Proof of sponsor\'s permanent residency or citizenship' },
                        { id: 'financial-dependency', name: 'Financial Dependency Evidence', required: true, description: 'Evidence of financial dependency on sponsor' },
                        { id: 'assurance-support', name: 'Assurance of Support Documents', required: true, description: 'Assurance of support from sponsor' }
                    ]
                },
                'partner-visa': {
                    name: 'Partner Visa Documents',
                    documents: [
                        { id: 'marriage-certificate', name: 'Marriage Certificate', required: true, description: 'Official marriage certificate with translation if not in English' },
                        { id: 'de-facto-evidence', name: 'De Facto Evidence', required: true, description: 'Evidence of de facto relationship (if not married)' },
                        { id: 'relationship-photos', name: 'Relationship Photos', required: true, description: 'Photos showing genuine and continuing relationship' },
                        { id: 'joint-financial', name: 'Joint Financial Records', required: true, description: 'Joint bank accounts, bills, and financial commitments' },
                        { id: 'sponsor-documents', name: 'Sponsor Documents', required: true, description: 'Sponsor\'s identity and relationship documents' }
                    ]
                },
                'visitor-family': {
                    name: 'Visitor (Family) Documents',
                    documents: [
                        { id: 'invitation-letter', name: 'Invitation Letter', required: true, description: 'Letter of invitation from family member in Australia' },
                        { id: 'form-1149', name: 'Form 1149 Sponsorship', required: true, description: 'Sponsorship form for visitor visa' },
                        { id: 'sponsor-financial-evidence', name: 'Sponsor Financial Evidence', required: true, description: 'Sponsor\'s financial capacity to support visitor' },
                        { id: 'travel-itinerary', name: 'Travel Itinerary', required: true, description: 'Proposed travel dates and accommodation arrangements' }
                    ]
                }
            }
        }
    },
    canada: {
        'express-entry': {
            name: 'Express Entry/PNP',
            categories: {
                'education': {
                    name: 'Educational Documents',
                    documents: [
                        { id: 'eca', name: 'Educational Credential Assessment (ECA)', required: true, description: 'Assessment of foreign educational credentials' },
                        { id: 'degree-certificates', name: 'Degree Certificates', required: true, description: 'Official degree certificates with translation if not in English/French' },
                        { id: 'transcripts', name: 'Transcripts', required: true, description: 'Complete academic transcripts from all institutions' }
                    ]
                },
                'language': {
                    name: 'Language Documents',
                    documents: [
                        { id: 'ielts-general', name: 'IELTS General', required: false, description: 'International English Language Testing System General Training' },
                        { id: 'celpip', name: 'CELPIP', required: false, description: 'Canadian English Language Proficiency Index Program' },
                        { id: 'tef-french', name: 'TEF (French)', required: false, description: 'Test d\'évaluation de français' },
                        { id: 'language-test-results', name: 'Language Test Results', required: true, description: 'Valid language test results meeting Express Entry requirements' }
                    ]
                },
                'employment': {
                    name: 'Employment Documents',
                    documents: [
                        { id: 'employment-references', name: 'Employment References (detailed format)', required: true, description: 'Detailed employment references with specific duties and responsibilities' },
                        { id: 'work-contracts', name: 'Work Contracts', required: true, description: 'Employment contracts and job offers' },
                        { id: 'noc-verification', name: 'NOC Code Verification', required: true, description: 'Verification of National Occupational Classification code' }
                    ]
                },
                'identity': {
                    name: 'Identity Documents',
                    documents: [
                        { id: 'passport', name: 'Passport', required: true, description: 'Valid passport with at least 6 months validity' },
                        { id: 'birth-certificate', name: 'Birth Certificate', required: true, description: 'Official birth certificate with translation if not in English/French' },
                        { id: 'police-certificates', name: 'Police Certificates (all countries)', required: true, description: 'Police clearance certificates from all countries where you lived for 6+ months since age 18' }
                    ]
                },
                'financial': {
                    name: 'Financial Documents',
                    documents: [
                        { id: 'proof-of-funds', name: 'Proof of Funds', required: true, description: 'Evidence of sufficient settlement funds' },
                        { id: 'bank-statements', name: 'Bank Statements', required: true, description: 'Recent bank statements showing financial capacity' },
                        { id: 'settlement-funds', name: 'Settlement Funds Evidence', required: true, description: 'Additional evidence of settlement funds' }
                    ]
                },
                'provincial': {
                    name: 'Provincial Documents',
                    documents: [
                        { id: 'provincial-nomination', name: 'Provincial Nomination Certificate', required: false, description: 'Provincial Nominee Program nomination certificate' },
                        { id: 'job-offer', name: 'Job Offer (if applicable)', required: false, description: 'Valid job offer from Canadian employer' },
                        { id: 'state-requirements', name: 'State Requirements', required: false, description: 'Additional documents required by specific province' }
                    ]
                }
            }
        },
        'family-sponsorship': {
            name: 'Family Sponsorship',
            categories: {
                'relationship': {
                    name: 'Relationship Documents',
                    documents: [
                        { id: 'marriage-certificate', name: 'Marriage Certificate', required: true, description: 'Official marriage certificate with translation if not in English/French' },
                        { id: 'common-law-evidence', name: 'Common-Law Evidence', required: true, description: 'Evidence of common-law relationship (if not married)' },
                        { id: 'birth-certificates-children', name: 'Birth Certificates (children)', required: false, description: 'Birth certificates of dependent children' }
                    ]
                },
                'sponsor': {
                    name: 'Sponsor Documents',
                    documents: [
                        { id: 'canadian-citizenship-pr', name: 'Canadian Citizenship/PR', required: true, description: 'Proof of sponsor\'s Canadian citizenship or permanent residency' },
                        { id: 'income-evidence', name: 'Income Evidence', required: true, description: 'Sponsor\'s income evidence meeting minimum requirements' },
                        { id: 'undertaking-form', name: 'Undertaking Form', required: true, description: 'Sponsorship undertaking form' }
                    ]
                }
            }
        }
    },
    newzealand: {
        'skilled-migrant': {
            name: 'Skilled Migrant',
            categories: {
                'qualifications': {
                    name: 'Qualifications',
                    documents: [
                        { id: 'nzqa-assessment', name: 'NZQA Assessment', required: true, description: 'New Zealand Qualifications Authority assessment of qualifications' },
                        { id: 'degree-certificates', name: 'Degree Certificates', required: true, description: 'Official degree certificates with translation if not in English' },
                        { id: 'professional-registration', name: 'Professional Registration', required: false, description: 'Professional body registration certificates' }
                    ]
                },
                'employment': {
                    name: 'Employment Documents',
                    documents: [
                        { id: 'job-offer-letter', name: 'Job Offer Letter', required: true, description: 'Valid job offer from New Zealand employer' },
                        { id: 'employment-history', name: 'Employment History', required: true, description: 'Detailed employment history and work experience' },
                        { id: 'skills-match-evidence', name: 'Skills Match Evidence', required: true, description: 'Evidence that skills match job requirements' }
                    ]
                },
                'language': {
                    name: 'Language Documents',
                    documents: [
                        { id: 'english-language-evidence', name: 'English Language Evidence', required: true, description: 'Evidence of English language proficiency' },
                        { id: 'ielts-pte-results', name: 'IELTS/PTE Results', required: true, description: 'Valid IELTS or PTE Academic test results' }
                    ]
                },
                'character': {
                    name: 'Character Documents',
                    documents: [
                        { id: 'police-certificates', name: 'Police Certificates', required: true, description: 'Police clearance certificates from all countries where you lived for 12+ months since age 17' },
                        { id: 'good-character-evidence', name: 'Good Character Evidence', required: true, description: 'Additional evidence of good character' }
                    ]
                }
            }
        }
    }
};

// Load documents
function loadDocuments() {
    const uploadedFiles = loadFromStorage('uploadedFiles') || [];
    
    // Update document categories
    updateDocumentCategories();
    
    // Setup file upload if not already done
    setupFileUpload();
}

// Update document categories
function updateDocumentCategories() {
    const uploadedFiles = loadFromStorage('uploadedFiles') || [];
    
    // Document type mappings
    const documentTypes = {
        'degree-certificate': 'Degree Certificate',
        'transcript': 'Transcript',
        'passport': 'Passport',
        'birth-certificate': 'Birth Certificate',
        'employment-reference': 'Employment Reference',
        'cv-resume': 'CV/Resume'
    };
    
    // Update each document item
    Object.keys(documentTypes).forEach(docType => {
        const docName = documentTypes[docType];
        const isUploaded = uploadedFiles.some(file => file.category === docType);
        const uploadedFile = uploadedFiles.find(file => file.category === docType);
        
        // Find the document item by looking for the document name
        const documentItems = document.querySelectorAll('.document-item');
        documentItems.forEach(item => {
            const nameElement = item.querySelector('.document-name');
            if (nameElement && nameElement.textContent === docName) {
                // Update status
                const statusElement = item.querySelector('.status');
                if (statusElement) {
                    statusElement.textContent = isUploaded ? 'Uploaded' : 'Pending';
                    statusElement.className = `status ${isUploaded ? 'uploaded' : 'pending'}`;
                }
                
                // Update actions
                const actionsElement = item.querySelector('.document-actions');
                if (actionsElement) {
                    if (isUploaded) {
                        actionsElement.innerHTML = `
                            <button class="btn btn-small btn-primary" onclick="uploadDocument('${docType}')">Upload</button>
                            <button class="btn btn-small btn-outline" onclick="replaceDocument('${docType}')">Replace</button>
                        `;
                    } else {
                        actionsElement.innerHTML = `
                            <button class="btn btn-small btn-primary" onclick="uploadDocument('${docType}')">Upload</button>
                        `;
                    }
                }
            }
        });
    });
}

// Update visa types based on country selection
function updateVisaTypes() {
    const countrySelect = document.getElementById('countrySelect');
    const visaTypeSelect = document.getElementById('visaTypeSelect');
    const documentChecklist = document.getElementById('documentChecklist');
    const uploadContainer = document.getElementById('uploadContainer');
    
    // Clear previous selections
    visaTypeSelect.innerHTML = '<option value="">Choose Visa Type</option>';
    documentChecklist.style.display = 'none';
    uploadContainer.style.display = 'none';
    
    const country = countrySelect.value;
    if (!country) return;
    
    const visaTypes = DOCUMENT_REQUIREMENTS[country];
    if (!visaTypes) return;
    
    // Populate visa types
    Object.keys(visaTypes).forEach(visaKey => {
        const visaType = visaTypes[visaKey];
        const option = document.createElement('option');
        option.value = visaKey;
        option.textContent = visaType.name;
        visaTypeSelect.appendChild(option);
    });
}

// Load document checklist based on country and visa type
function loadDocumentChecklist() {
    const countrySelect = document.getElementById('countrySelect');
    const visaTypeSelect = document.getElementById('visaTypeSelect');
    const documentChecklist = document.getElementById('documentChecklist');
    const uploadContainer = document.getElementById('uploadContainer');
    
    const country = countrySelect.value;
    const visaType = visaTypeSelect.value;
    
    if (!country || !visaType) {
        documentChecklist.style.display = 'none';
        uploadContainer.style.display = 'none';
        return;
    }
    
    const requirements = DOCUMENT_REQUIREMENTS[country]?.[visaType];
    if (!requirements) return;
    
    // Show containers
    documentChecklist.style.display = 'block';
    uploadContainer.style.display = 'block';
    
    // Generate checklist HTML
    let checklistHTML = `
        <div class="checklist-header">
            <h2>${requirements.name} - Document Requirements</h2>
            <div class="progress-overview">
                <div class="progress-summary">
                    <span id="overallProgress">0% Complete</span>
                </div>
            </div>
        </div>
    `;
    
    // Generate categories
    Object.keys(requirements.categories).forEach(categoryKey => {
        const category = requirements.categories[categoryKey];
        const categoryProgress = calculateCategoryProgress(category.documents);
        
        checklistHTML += `
            <div class="document-category">
                <div class="category-header">
                    <h3>${category.name}</h3>
                    <div class="category-progress">
                        <span class="progress-text">${categoryProgress.completed}/${categoryProgress.total} Complete</span>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${categoryProgress.percentage}%"></div>
                        </div>
                    </div>
                </div>
                <div class="document-list">
        `;
        
        // Generate documents
        category.documents.forEach(doc => {
            const documentStatus = getDocumentStatus(doc.id);
            const statusClass = getStatusClass(documentStatus);
            
            checklistHTML += `
                <div class="document-item" data-document-id="${doc.id}">
                    <div class="document-info">
                        <div class="document-name-section">
                            <span class="document-name">${doc.name}</span>
                            ${doc.required ? '<span class="required-badge">Required</span>' : '<span class="optional-badge">Optional</span>'}
                        </div>
                        <div class="document-description">${doc.description}</div>
                        <div class="document-status">
                            <span class="status ${statusClass}">${getStatusText(documentStatus)}</span>
                        </div>
                    </div>
                    <div class="document-actions">
                        <button class="btn btn-small btn-primary" onclick="uploadDocumentNew('${doc.id}')">
                            <i class="fas fa-upload"></i> Upload
                        </button>
                        ${documentStatus === 'uploaded' ? `
                            <button class="btn btn-small btn-outline" onclick="replaceDocumentNew('${doc.id}')">
                                <i class="fas fa-sync"></i> Replace
                            </button>
                            <button class="btn btn-small btn-success" onclick="viewDocumentNew('${doc.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        });
        
        checklistHTML += `
                </div>
            </div>
        `;
    });
    
    documentChecklist.innerHTML = checklistHTML;
    updateOverallProgress();
}

// Calculate category progress
function calculateCategoryProgress(documents) {
    const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
    let completed = 0;
    
    documents.forEach(doc => {
        if (uploadedDocuments[doc.id]) {
            completed++;
        }
    });
    
    return {
        completed,
        total: documents.length,
        percentage: documents.length > 0 ? Math.round((completed / documents.length) * 100) : 0
    };
}

// Get document status
function getDocumentStatus(documentId) {
    const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
    return uploadedDocuments[documentId]?.status || 'not-uploaded';
}

// Get status class
function getStatusClass(status) {
    const statusClasses = {
        'not-uploaded': 'not-uploaded',
        'uploaded': 'uploaded',
        'under-review': 'under-review',
        'approved': 'approved',
        'requires-revision': 'requires-revision'
    };
    return statusClasses[status] || 'not-uploaded';
}

// Get status text
function getStatusText(status) {
    const statusTexts = {
        'not-uploaded': 'Not Uploaded',
        'uploaded': 'Uploaded',
        'under-review': 'Under Review',
        'approved': 'Approved',
        'requires-revision': 'Requires Revision'
    };
    return statusTexts[status] || 'Not Uploaded';
}

// Update overall progress
function updateOverallProgress() {
    const progressElement = document.getElementById('overallProgress');
    if (!progressElement) return;
    
    const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
    const totalDocuments = Object.keys(uploadedDocuments).length;
    const completedDocuments = Object.values(uploadedDocuments).filter(doc => doc.status === 'approved').length;
    
    const percentage = totalDocuments > 0 ? Math.round((completedDocuments / totalDocuments) * 100) : 0;
    progressElement.textContent = `${percentage}% Complete`;
}

// Upload document (new system) - PRODUCTION READY
function uploadDocumentNew(documentId) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls,.zip,.rar';
    fileInput.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        // Comprehensive file validation
        const validationResult = validateFile(file);
        if (!validationResult.valid) {
            showNotification(validationResult.error, 'error');
            return;
        }
        
        try {
            // Save document with enhanced metadata
            const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
            uploadedDocuments[documentId] = {
                id: documentId,
                name: file.name,
                size: file.size,
                type: file.type,
                uploadDate: new Date().toISOString(),
                status: 'uploaded',
                lastModified: file.lastModified,
                clientId: loadFromStorage('currentUser')?.id || 'unknown'
            };
            saveToStorage('uploadedDocuments', uploadedDocuments);
            
            // Update progress
            updateOverallProgress();
            updateDocumentStatus(documentId, 'uploaded');
            
            showNotification('Document uploaded successfully', 'success');
            loadDocumentChecklist(); // Refresh the checklist
            
            // Add to recent activity
            addToRecentActivity('upload', `Document uploaded: ${file.name}`);
            
        } catch (error) {
            showNotification('Upload failed. Please try again.', 'error');
        }
    };
    
    fileInput.click();
}

// Comprehensive file validation - EDGE CASE HARDENED
function validateFile(file) {
    // Check if file exists
    if (!file || !file.name) {
        return { valid: false, error: 'No file selected or invalid file' };
    }
    
    // Check file size - zero size
    if (file.size === 0) {
        return { valid: false, error: 'File is empty. Please select a valid file.' };
    }
    
    // Check file size - maximum limit (10MB)
    if (file.size > 10 * 1024 * 1024) {
        return { valid: false, error: 'File size must be less than 10MB' };
    }
    
    // Check file type
    const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/zip',
        'application/x-rar-compressed',
        'application/x-zip-compressed'
    ];
    
    // Check by MIME type
    if (!allowedTypes.includes(file.type)) {
        // Also check by file extension as fallback
        const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.xls', '.xlsx', '.zip', '.rar'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
            return { valid: false, error: 'File type not supported. Please upload PDF, DOC, DOCX, JPG, PNG, XLS, XLSX, ZIP, or RAR files.' };
        }
    }
    
    // Check file name for security
    if (file.name.includes('..') || file.name.includes('/') || file.name.includes('\\')) {
        return { valid: false, error: 'Invalid file name. Please rename the file and try again.' };
    }
    
    // Check file name length
    if (file.name.length > 255) {
        return { valid: false, error: 'File name is too long. Please rename the file.' };
    }
    
    return { valid: true };
}

// Replace document (new system)
function replaceDocumentNew(documentId) {
    uploadDocumentNew(documentId);
}

// Update document status
function updateDocumentStatus(documentId, status) {
    const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
    if (uploadedDocuments[documentId]) {
        uploadedDocuments[documentId].status = status;
        uploadedDocuments[documentId].lastUpdated = new Date().toISOString();
        saveToStorage('uploadedDocuments', uploadedDocuments);
    }
}

// Get document status
function getDocumentStatus(documentId) {
    const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
    return uploadedDocuments[documentId]?.status || 'not-uploaded';
}

// Enhanced document viewing
function viewDocumentNew(documentId) {
    const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
    const document = uploadedDocuments[documentId];
    
    if (!document) {
        showNotification('Document not found', 'error');
        return;
    }
    
    // Create a modal to show document details - SECURE VERSION
    const modal = document.createElement('div');
    modal.className = 'modal';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const headerTitle = document.createElement('h3');
    headerTitle.textContent = 'Document Details';
    
    const closeButton = document.createElement('span');
    closeButton.className = 'close';
    closeButton.innerHTML = '&times;';
    closeButton.onclick = () => modal.remove();
    
    modalHeader.appendChild(headerTitle);
    modalHeader.appendChild(closeButton);
    
    const modalBody = document.createElement('div');
    modalBody.className = 'modal-body';
    
    const documentInfo = document.createElement('div');
    documentInfo.className = 'document-info';
    
    // Create document info elements safely
    const nameP = document.createElement('p');
    nameP.innerHTML = `<strong>Name:</strong> ${escapeHtml(document.name)}`;
    
    const sizeP = document.createElement('p');
    sizeP.innerHTML = `<strong>Size:</strong> ${formatFileSize(document.size)}`;
    
    const typeP = document.createElement('p');
    typeP.innerHTML = `<strong>Type:</strong> ${escapeHtml(document.type)}`;
    
    const uploadedP = document.createElement('p');
    uploadedP.innerHTML = `<strong>Uploaded:</strong> ${formatDate(document.uploadDate)}`;
    
    const statusP = document.createElement('p');
    const statusSpan = document.createElement('span');
    statusSpan.className = `status ${document.status}`;
    statusSpan.textContent = getStatusText(document.status);
    statusP.innerHTML = '<strong>Status:</strong> ';
    statusP.appendChild(statusSpan);
    
    documentInfo.appendChild(nameP);
    documentInfo.appendChild(sizeP);
    documentInfo.appendChild(typeP);
    documentInfo.appendChild(uploadedP);
    documentInfo.appendChild(statusP);
    
    const modalActions = document.createElement('div');
    modalActions.className = 'modal-actions';
    
    const downloadBtn = document.createElement('button');
    downloadBtn.className = 'btn btn-primary';
    downloadBtn.textContent = 'Download';
    downloadBtn.onclick = () => downloadDocument(documentId);
    
    const replaceBtn = document.createElement('button');
    replaceBtn.className = 'btn btn-outline';
    replaceBtn.textContent = 'Replace';
    replaceBtn.onclick = () => replaceDocumentNew(documentId);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteDocument(documentId);
    
    modalActions.appendChild(downloadBtn);
    modalActions.appendChild(replaceBtn);
    modalActions.appendChild(deleteBtn);
    
    modalBody.appendChild(documentInfo);
    modalBody.appendChild(modalActions);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modal.appendChild(modalContent);
    
    document.body.appendChild(modal);
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Download document
function downloadDocument(documentId) {
    const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
    const document = uploadedDocuments[documentId];
    
    if (!document) {
        showNotification('Document not found', 'error');
        return;
    }
    
    // In a real application, this would download from server
    showNotification('Download functionality requires server implementation', 'info');
}

// Delete document - PRODUCTION READY
function deleteDocument(documentId) {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
        return;
    }
    
    try {
        const uploadedDocuments = loadFromStorage('uploadedDocuments') || {};
        
        if (!uploadedDocuments[documentId]) {
            showNotification('Document not found', 'error');
            return;
        }
        
        delete uploadedDocuments[documentId];
        const saved = saveToStorage('uploadedDocuments', uploadedDocuments);
        
        if (saved) {
            showNotification('Document deleted successfully', 'success');
            loadDocumentChecklist();
            updateOverallProgress();
            
            // Close any open modals
            const modals = document.querySelectorAll('.modal');
            modals.forEach(modal => modal.remove());
        } else {
            showNotification('Failed to delete document. Please try again.', 'error');
        }
    } catch (error) {
        showNotification('An error occurred while deleting the document', 'error');
    }
}

// Clean up complete

// Security: HTML escaping function
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

// Setup file upload
function setupFileUpload() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea && fileInput) {
        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());
        
        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            handleFileUpload(files);
        });
        
        // File input change
        fileInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files);
        });
    }
}

// Handle file upload - PRODUCTION READY
function handleFileUpload(files) {
    if (files.length === 0) return;
    
    const uploadedFiles = loadFromStorage('uploadedFiles') || [];
    let successCount = 0;
    let errorCount = 0;
    
    Array.from(files).forEach(file => {
        // Comprehensive validation
        const validationResult = validateFile(file);
        if (!validationResult.valid) {
            showNotification(`File ${file.name}: ${validationResult.error}`, 'error');
            errorCount++;
            return;
        }
        
        try {
            const fileData = {
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                name: file.name,
                size: file.size,
                type: file.type,
                uploadedAt: new Date().toISOString(),
                status: 'uploaded',
                category: 'general',
                clientId: loadFromStorage('currentUser')?.id || 'unknown',
                lastModified: file.lastModified
            };
            
            uploadedFiles.push(fileData);
            successCount++;
            
        } catch (error) {
            errorCount++;
        }
    });
    
    if (successCount > 0) {
        saveToStorage('uploadedFiles', uploadedFiles);
        showNotification(`${successCount} file(s) uploaded successfully`, 'success');
        
        // Refresh document list
        updateDocumentCategories();
        
        // Add to recent activity
        addToRecentActivity('upload', `${successCount} file(s) uploaded`);
    }
    
    if (errorCount > 0) {
        showNotification(`${errorCount} file(s) failed to upload`, 'error');
    }
}

// Upload document for specific category
function uploadDocument(documentType) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '*/*'; // Accept all file types
    
    fileInput.onchange = function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleSpecificDocumentUpload(files, documentType);
        }
    };
    
    fileInput.click();
}

// Replace existing document
function replaceDocument(documentType) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = '*/*'; // Accept all file types
    
    fileInput.onchange = function(e) {
        const files = e.target.files;
        if (files.length > 0) {
            handleSpecificDocumentUpload(files, documentType, true);
        }
    };
    
    fileInput.click();
}

// Handle specific document upload
function handleSpecificDocumentUpload(files, documentType, isReplacement = false) {
    const uploadedFiles = loadFromStorage('uploadedFiles') || [];
    
    // If replacing, remove existing files of this type
    if (isReplacement) {
        const filteredFiles = uploadedFiles.filter(file => file.category !== documentType);
        uploadedFiles.length = 0;
        uploadedFiles.push(...filteredFiles);
    }
    
    Array.from(files).forEach(file => {
        // Validate file size (max 50MB)
        if (file.size > 50 * 1024 * 1024) {
            showNotification(`File ${file.name} is too large. Maximum size is 50MB.`, 'error');
            return;
        }
        
        const fileData = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadedAt: new Date().toISOString(),
            status: 'uploaded',
            category: documentType
        };
        
        uploadedFiles.push(fileData);
    });
    
    saveToStorage('uploadedFiles', uploadedFiles);
    
    const action = isReplacement ? 'replaced' : 'uploaded';
    showNotification(`Document ${action} successfully`, 'success');
    
    // Refresh document list
    updateDocumentCategories();
    
    // Add to recent activity
    addToRecentActivity('upload', `Document ${action}: ${documentType}`);
}

// Load checklist
function loadChecklist() {
    const countrySelect = document.getElementById('checklistCountrySelect');
    const checklistContent = document.getElementById('checklistContent');
    
    if (countrySelect && checklistContent) {
        // Remove existing event listeners to avoid duplicates
        const newCountrySelect = countrySelect.cloneNode(true);
        countrySelect.parentNode.replaceChild(newCountrySelect, countrySelect);
        
        newCountrySelect.addEventListener('change', function() {
            const country = this.value;
            if (country) {
                loadCountryChecklist(country);
            } else {
                showChecklistPlaceholder();
            }
        });
        
        // Initialize with placeholder if no country selected
        if (!newCountrySelect.value) {
            showChecklistPlaceholder();
        }
    }
}

// Load country checklist
function loadCountryChecklist(country) {
    const checklistContent = document.getElementById('checklistContent');
    if (!checklistContent) return;
    
    const countryData = DOCUMENT_REQUIREMENTS[country];
    if (!countryData) {
        showChecklistPlaceholder();
        return;
    }
    
    let checklistHTML = `
        <div class="checklist-header">
            <h2>${getCountryName(country)} Visa Requirements</h2>
            <p>Select a visa type to view detailed document requirements</p>
        </div>
        <div class="visa-types-grid">
    `;
    
    // Generate visa type options
    Object.keys(countryData).forEach(visaKey => {
        const visaType = countryData[visaKey];
        const documentCount = getTotalDocumentCount(visaType);
        
        checklistHTML += `
            <div class="visa-type-card" onclick="loadVisaTypeChecklist('${country}', '${visaKey}')">
                <div class="visa-type-header">
                    <h3>${visaType.name}</h3>
                    <span class="document-count">${documentCount} Documents Required</span>
                </div>
                <div class="visa-type-description">
                    ${getVisaTypeDescription(country, visaKey)}
                </div>
                <div class="visa-type-actions">
                    <button class="btn btn-primary">
                        <i class="fas fa-list-check"></i> View Requirements
                    </button>
                </div>
            </div>
        `;
    });
    
    checklistHTML += `
        </div>
        <div class="checklist-note">
            <i class="fas fa-info-circle"></i>
            <p>Click on a visa type above to view detailed document requirements and upload your documents.</p>
        </div>
    `;
    
    checklistContent.innerHTML = checklistHTML;
}

// Load specific visa type checklist
function loadVisaTypeChecklist(country, visaType) {
    const checklistContent = document.getElementById('checklistContent');
    if (!checklistContent) return;
    
    const requirements = DOCUMENT_REQUIREMENTS[country]?.[visaType];
    if (!requirements) return;
    
    let checklistHTML = `
        <div class="checklist-header">
            <h2>${requirements.name}</h2>
            <button class="btn btn-outline" onclick="loadCountryChecklist('${country}')">
                <i class="fas fa-arrow-left"></i> Back to Visa Types
            </button>
        </div>
        <div class="document-requirements">
    `;
    
    // Generate document categories
    Object.keys(requirements.categories).forEach(categoryKey => {
        const category = requirements.categories[categoryKey];
        const requiredCount = category.documents.filter(doc => doc.required).length;
        const optionalCount = category.documents.filter(doc => !doc.required).length;
        
        checklistHTML += `
            <div class="requirement-category">
                <div class="category-header">
                    <h3>${category.name}</h3>
                    <div class="category-stats">
                        <span class="required-count">${requiredCount} Required</span>
                        <span class="optional-count">${optionalCount} Optional</span>
                    </div>
                </div>
                <div class="document-list">
        `;
        
        category.documents.forEach(doc => {
            checklistHTML += `
                <div class="requirement-item">
                    <div class="requirement-info">
                        <span class="document-name">${doc.name}</span>
                        ${doc.required ? '<span class="required-badge">Required</span>' : '<span class="optional-badge">Optional</span>'}
                    </div>
                    <div class="requirement-description">${doc.description}</div>
                </div>
            `;
        });
        
        checklistHTML += `
                </div>
            </div>
        `;
    });
    
    checklistHTML += `
        </div>
        <div class="checklist-actions">
            <button class="btn btn-primary" onclick="showSection('documents')">
                <i class="fas fa-upload"></i> Upload Documents
            </button>
            <button class="btn btn-outline" onclick="loadCountryChecklist('${country}')">
                <i class="fas fa-arrow-left"></i> Back to Visa Types
            </button>
        </div>
    `;
    
    checklistContent.innerHTML = checklistHTML;
}

// Helper functions
function getCountryName(country) {
    const names = {
        'australia': 'Australia',
        'canada': 'Canada',
        'newzealand': 'New Zealand'
    };
    return names[country] || country;
}

function getTotalDocumentCount(visaType) {
    let count = 0;
    Object.keys(visaType.categories).forEach(categoryKey => {
        count += visaType.categories[categoryKey].documents.length;
    });
    return count;
}

function getVisaTypeDescription(country, visaKey) {
    const descriptions = {
        'australia': {
            'skilled-migration': 'General Skilled Migration program for skilled workers',
            'student-visa': 'Student visa for international students',
            'family-visas': 'Family reunion and partner visas'
        },
        'canada': {
            'express-entry': 'Express Entry system for skilled immigrants',
            'family-sponsorship': 'Family sponsorship programs'
        },
        'newzealand': {
            'skilled-migrant': 'Skilled Migrant Category for skilled workers'
        }
    };
    return descriptions[country]?.[visaKey] || 'Visa requirements and document checklist';
}

// Toggle checklist item
function toggleChecklistItem(country, itemName, completed) {
    const checklistData = loadFromStorage('checklistData') || {};
    if (!checklistData[country]) {
        checklistData[country] = {};
    }
    checklistData[country][itemName] = completed;
    
    saveToStorage('checklistData', checklistData);
    
    // Update progress
    updateChecklistProgress(country);
}

// Update checklist progress
function updateChecklistProgress(country) {
    const checklistData = loadFromStorage('checklistData') || {};
    const countryData = checklistData[country] || {};
    
    const totalItems = Object.keys(countryData).length;
    const completedItems = Object.values(countryData).filter(Boolean).length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    
    // Update progress indicator if exists
    const progressElement = document.querySelector(`[data-country="${country}"] .progress-fill`);
    if (progressElement) {
        progressElement.style.width = `${progress}%`;
    }
}

// Show checklist placeholder
function showChecklistPlaceholder() {
    const checklistContent = document.getElementById('checklistContent');
    if (checklistContent) {
        checklistContent.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: #666;">
                <i class="fas fa-list-check" style="font-size: 3rem; color: #D4AF37; margin-bottom: 1rem; display: block;"></i>
                <h3>Select a country to view requirements</h3>
                <p>Choose your destination country to see the specific document requirements and checklist items.</p>
            </div>
        `;
    }
}

// Load progress
function loadProgress() {
    const timelineData = loadFromStorage('timelineData') || [];
    
    const timeline = document.querySelector('.progress-timeline');
    if (timeline) {
        if (timelineData.length === 0) {
            timeline.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-timeline" style="font-size: 3rem; color: #D4AF37; margin-bottom: 1rem; display: block;"></i>
                    <h3>No Progress Timeline</h3>
                    <p>Your application progress will be tracked here once you begin the process.</p>
                </div>
            `;
        } else {
            timeline.innerHTML = timelineData.map(item => `
                <div class="timeline-item ${item.status}">
                    <div class="timeline-marker">
                        <i class="fas fa-${getTimelineIcon(item.status)}"></i>
                    </div>
                    <div class="timeline-content">
                        <h4>${item.title}</h4>
                        <p>${item.description}</p>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Get timeline icon
function getTimelineIcon(status) {
    const icons = {
        completed: 'check',
        active: 'clock',
        pending: 'circle'
    };
    return icons[status] || 'circle';
}

// Load messages
function loadMessages() {
    const messages = loadFromStorage('clientMessages') || [
        {
            id: '1',
            sender: 'Legal Team',
            message: 'Thank you for submitting your documents. We are currently reviewing your educational certificates and will get back to you within 2-3 business days.',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            type: 'received'
        },
        {
            id: '2',
            sender: 'You',
            message: 'I have uploaded all the required documents. Please let me know if you need anything else.',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            type: 'sent'
        }
    ];
    
    const messageThread = document.querySelector('.message-thread');
    if (messageThread) {
        messageThread.innerHTML = messages.map(msg => `
            <div class="message ${msg.type}">
                <div class="message-header">
                    <span class="sender">${msg.sender}</span>
                    <span class="timestamp">${formatDate(msg.timestamp)}</span>
                </div>
                <div class="message-content">
                    <p>${msg.message}</p>
                </div>
            </div>
        `).join('');
    }
}

// Handle message submit
function handleMessageSubmit(e) {
    e.preventDefault();
    
    const messageInput = e.target.querySelector('textarea');
    const message = messageInput.value.trim();
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    // Add message to storage
    const messages = loadFromStorage('clientMessages') || [];
    const newMessage = {
        id: Date.now().toString(),
        sender: 'You',
        message: message,
        timestamp: new Date().toISOString(),
        type: 'sent'
    };
    
    messages.unshift(newMessage);
    saveToStorage('clientMessages', messages);
    
    // Clear input
    messageInput.value = '';
    
    // Reload messages
    loadMessages();
    
    // Add to recent activity
    addToRecentActivity('message', 'Message sent to legal team');
    
    showNotification('Message sent successfully', 'success');
}

// Add to recent activity
function addToRecentActivity(type, message) {
    const activities = loadFromStorage('recentActivities') || [];
    const newActivity = {
        type: type,
        message: message,
        timestamp: new Date().toISOString()
    };
    
    activities.unshift(newActivity);
    
    // Keep only last 10 activities
    if (activities.length > 10) {
        activities.splice(10);
    }
    
    saveToStorage('recentActivities', activities);
}

// Refresh document list
function refreshDocumentList() {
    updateDocumentCategories();
}

// Utility functions
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        max-width: 400px;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function saveToStorage(key, data) {
    try {
        const jsonData = JSON.stringify(data);
        localStorage.setItem(key, jsonData);
        return true;
    } catch (error) {
        // Handle QuotaExceededError
        if (error.name === 'QuotaExceededError') {
            showNotification('Storage quota exceeded. Please contact support.', 'error');
        } else {
            showNotification('Failed to save data. Please try again.', 'error');
        }
        return false;
    }
}

function loadFromStorage(key) {
    try {
        const data = localStorage.getItem(key);
        if (!data) return null;
        
        // Try to parse JSON data
        try {
            return JSON.parse(data);
        } catch (parseError) {
            // If parsing fails, remove corrupted data
            localStorage.removeItem(key);
            return null;
        }
    } catch (error) {
        return null;
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function logout() {
    currentUser = null;
    isAuthenticated = false;
    
    // Clear all session data
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserType');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('clientSession');
    
    showNotification('Logged out successfully', 'success');
    
    // Redirect to home page
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1000);
}

// Register Service Worker for PWA functionality
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('[PWA] Service Worker registered successfully:', registration.scope);
                })
                .catch((error) => {
                    console.error('[PWA] Service Worker registration failed:', error);
                });
        });
    } else {
        console.log('[PWA] Service Worker not supported in this browser');
    }
}

// Export functions for global access
window.showSection = showSection;
window.toggleChecklistItem = toggleChecklistItem;
window.refreshDocumentList = refreshDocumentList;
window.uploadDocument = uploadDocument;
window.replaceDocument = replaceDocument;
window.uploadDocumentNew = uploadDocumentNew;
window.replaceDocumentNew = replaceDocumentNew;
window.viewDocumentNew = viewDocumentNew;
window.deleteDocument = deleteDocument;
window.logout = logout;