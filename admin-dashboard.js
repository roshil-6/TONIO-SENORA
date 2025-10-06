// Admin Dashboard JavaScript for Tonio & Senora

// Global variables
let currentUser = null;
let isAuthenticated = false;

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminDashboard();
    setupAdminEventListeners();
    registerServiceWorker();
});

// Admin credentials (must match script.js)
const ADMIN_CREDENTIALS = {
    email: 'docunittoniosenora@gmail.com',
    password: 'Senora@2024'
};

// Initialize admin dashboard
function initializeAdminDashboard() {
    // Clear any client session data first
    localStorage.removeItem('clientSession');
    
    // Check for admin session
    const adminSession = localStorage.getItem('adminSession');
    const savedUser = localStorage.getItem('currentUser');
    
    if (!adminSession || !savedUser) {
        // No valid admin session, show unauthorized error
        clearAllSessions();
        showUnauthorizedError();
        return;
    }
    
    currentUser = JSON.parse(savedUser);
    
    // Verify admin credentials
    if (currentUser.accountType !== 'admin' || 
        currentUser.email !== ADMIN_CREDENTIALS.email) {
        // Clear invalid session and show error
        clearAllSessions();
        showUnauthorizedError();
        return;
    }
    
    isAuthenticated = true;
    
    // Update admin name
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = `Admin Panel - ${currentUser.name}`;
    }
    
    // Load initial data
    loadAdminDashboardData();
    loadClients();
    loadDocumentReviews();
    loadApplications();
    loadCommunications();
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
                    You do not have permission to access the admin panel. 
                    Please contact the system administrator for access.
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

// Setup admin event listeners
function setupAdminEventListeners() {
    // Sidebar navigation
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sectionId = this.getAttribute('href').substring(1);
            showSection(sectionId);
        });
    });
    
    // Client search
    const clientSearch = document.getElementById('clientSearch');
    if (clientSearch) {
        clientSearch.addEventListener('input', debounce(filterClients, 300));
    }
    
    // Status filter
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterClients);
    }
    
    // Country filter
    const countryFilter = document.getElementById('countryFilter');
    if (countryFilter) {
        countryFilter.addEventListener('change', filterClients);
    }
    
    // Review filters
    const reviewStatus = document.getElementById('reviewStatus');
    if (reviewStatus) {
        reviewStatus.addEventListener('change', filterDocumentReviews);
    }
    
    const reviewClient = document.getElementById('reviewClient');
    if (reviewClient) {
        reviewClient.addEventListener('change', filterDocumentReviews);
    }
    
    // Admin message form
    const adminMessageForm = document.getElementById('adminMessageForm');
    if (adminMessageForm) {
        adminMessageForm.addEventListener('submit', handleAdminMessageSubmit);
    }
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
    }
    
    // Update active sidebar link
    const sidebarLinks = document.querySelectorAll('.sidebar-link');
    sidebarLinks.forEach(link => link.classList.remove('active'));
    
    const activeLink = document.querySelector(`[href="#${sectionId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
    
    // Load section-specific data
    switch(sectionId) {
        case 'clients':
            loadClients();
            break;
        case 'documents':
            loadDocumentReviews();
            break;
        case 'applications':
            loadApplications();
            break;
        case 'communications':
            loadCommunications();
            break;
        case 'reports':
            loadReports();
            break;
    }
}

// Load admin dashboard data
function loadAdminDashboardData() {
    // Load statistics
    loadDashboardStats();
    
    // Load recent activities
    loadAdminRecentActivities();
    
    // Load application status overview
    loadApplicationStatusOverview();
}

// Load dashboard statistics
function loadDashboardStats() {
    const stats = {
        activeClients: 0,
        pendingReviews: 0,
        completedThisMonth: 0,
        overdueTasks: 0
    };
    
    // Update stat cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach((card, index) => {
        const valueElement = card.querySelector('h3');
        if (valueElement) {
            const values = Object.values(stats);
            valueElement.textContent = values[index] || 0;
        }
    });
}

// Load admin recent activities
function loadAdminRecentActivities() {
    const activities = loadFromStorage('adminActivities') || [];
    
    const activityList = document.querySelector('.activity-list');
    if (activityList) {
        if (activities.length === 0) {
            activityList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history" style="font-size: 3rem; color: #D4AF37; margin-bottom: 1rem; display: block;"></i>
                    <h3>No Recent Activity</h3>
                    <p>Activity will appear here as clients interact with the system.</p>
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

// Load application status overview
function loadApplicationStatusOverview() {
    const statusData = {
        'In Review': 0,
        'Document Collection': 0,
        'Ready for Submission': 0
    };
    
    const statusChart = document.querySelector('.status-chart');
    if (statusChart) {
        statusChart.innerHTML = Object.entries(statusData).map(([status, count]) => `
            <div class="status-item">
                <span class="status-label">${status}</span>
                <div class="status-bar">
                    <div class="status-fill" style="width: 0%"></div>
                </div>
                <span class="status-count">${count}</span>
            </div>
        `).join('');
    }
}

// Load clients
function loadClients() {
    const clients = loadFromStorage('clients') || [];
    
    const clientsTable = document.querySelector('.clients-table tbody');
    if (clientsTable) {
        if (clients.length === 0) {
            clientsTable.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem; color: #666;">
                        <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; display: block;"></i>
                        <p>No clients registered yet</p>
                        <small>Clients will appear here once they register</small>
                    </td>
                </tr>
            `;
        } else {
            clientsTable.innerHTML = clients.map(client => `
                <tr>
                    <td>${client.name}</td>
                    <td>${client.email}</td>
                    <td>${client.country}</td>
                    <td><span class="status-badge status-${client.status.toLowerCase().replace(' ', '-')}">${client.status}</span></td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${client.progress}%"></div>
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-small btn-primary" onclick="viewClient('${client.id}')">View</button>
                        <button class="btn btn-small btn-outline" onclick="messageClient('${client.id}')">Message</button>
                    </td>
                </tr>
            `).join('');
        }
    }
}

// Filter clients
function filterClients() {
    const searchTerm = document.getElementById('clientSearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const countryFilter = document.getElementById('countryFilter')?.value || '';
    
    const clients = loadFromStorage('clients') || [];
    const filteredClients = clients.filter(client => {
        const matchesSearch = client.name.toLowerCase().includes(searchTerm) || 
                            client.email.toLowerCase().includes(searchTerm);
        const matchesStatus = !statusFilter || client.status.toLowerCase().includes(statusFilter.toLowerCase());
        const matchesCountry = !countryFilter || client.country.toLowerCase().includes(countryFilter.toLowerCase());
        
        return matchesSearch && matchesStatus && matchesCountry;
    });
    
    const clientsTable = document.querySelector('.clients-table tbody');
    if (clientsTable) {
        clientsTable.innerHTML = filteredClients.map(client => `
            <tr>
                <td>${client.name}</td>
                <td>${client.email}</td>
                <td>${client.country}</td>
                <td><span class="status-badge status-${client.status.toLowerCase().replace(' ', '-')}">${client.status}</span></td>
                <td>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${client.progress}%"></div>
                    </div>
                </td>
                <td>
                    <button class="btn btn-small btn-primary" onclick="viewClient('${client.id}')">View</button>
                    <button class="btn btn-small btn-outline" onclick="messageClient('${client.id}')">Message</button>
                </td>
            </tr>
        `).join('');
    }
}

// View client
function viewClient(clientId) {
    const clients = loadFromStorage('clients') || [];
    const client = clients.find(c => c.id === clientId);
    
    if (client) {
        showNotification(`Viewing details for ${client.name}`, 'info');
        // Here you would typically open a modal or navigate to a detailed view
    }
}

// Message client
function messageClient(clientId) {
    const clients = loadFromStorage('clients') || [];
    const client = clients.find(c => c.id === clientId);
    
    if (client) {
        showNotification(`Opening message thread with ${client.name}`, 'info');
        // Switch to communications section and focus on this client
        showSection('communications');
        // Here you would typically highlight the specific client's message thread
    }
}

// Load document reviews
function loadDocumentReviews() {
    const documentReviews = loadFromStorage('documentReviews') || [];
    
    const documentList = document.querySelector('.document-list');
    if (documentList) {
        if (documentReviews.length === 0) {
            documentList.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-file-upload" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <h3>No documents to review</h3>
                    <p>Documents will appear here once clients upload them</p>
                </div>
            `;
        } else {
            documentList.innerHTML = documentReviews.map(doc => `
                <div class="document-review-item">
                    <div class="document-info">
                        <h4>${doc.title}</h4>
                        <p>Uploaded: ${formatDate(doc.uploadedAt)}</p>
                        <span class="document-type">${doc.type}</span>
                    </div>
                    <div class="document-actions">
                        <button class="btn btn-small btn-outline" onclick="previewDocument('${doc.id}')">Preview</button>
                        <button class="btn btn-small btn-success" onclick="approveDocument('${doc.id}')">Approve</button>
                        <button class="btn btn-small btn-danger" onclick="rejectDocument('${doc.id}')">Reject</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// Filter document reviews
function filterDocumentReviews() {
    const statusFilter = document.getElementById('reviewStatus')?.value || '';
    const clientFilter = document.getElementById('reviewClient')?.value || '';
    
    const documentReviews = loadFromStorage('documentReviews') || [];
    const filteredReviews = documentReviews.filter(doc => {
        const matchesStatus = !statusFilter || doc.status === statusFilter;
        const matchesClient = !clientFilter || doc.client.toLowerCase().includes(clientFilter.toLowerCase());
        
        return matchesStatus && matchesClient;
    });
    
    const documentList = document.querySelector('.document-list');
    if (documentList) {
        documentList.innerHTML = filteredReviews.map(doc => `
            <div class="document-review-item">
                <div class="document-info">
                    <h4>${doc.title}</h4>
                    <p>Uploaded: ${formatDate(doc.uploadedAt)}</p>
                    <span class="document-type">${doc.type}</span>
                </div>
                <div class="document-actions">
                    <button class="btn btn-small btn-outline" onclick="previewDocument('${doc.id}')">Preview</button>
                    <button class="btn btn-small btn-success" onclick="approveDocument('${doc.id}')">Approve</button>
                    <button class="btn btn-small btn-danger" onclick="rejectDocument('${doc.id}')">Reject</button>
                </div>
            </div>
        `).join('');
    }
}

// Preview document
function previewDocument(documentId) {
    showNotification('Opening document preview...', 'info');
    // Here you would typically open a modal with the document preview
}

// Approve document
function approveDocument(documentId) {
    const documentReviews = loadFromStorage('documentReviews') || [];
    const docIndex = documentReviews.findIndex(doc => doc.id === documentId);
    
    if (docIndex !== -1) {
        documentReviews[docIndex].status = 'approved';
        saveToStorage('documentReviews', documentReviews);
        
        showNotification('Document approved successfully', 'success');
        loadDocumentReviews();
        
        // Add to admin activities
        addToAdminActivities('approval', `Document approved: ${documentReviews[docIndex].title}`);
    }
}

// Reject document
function rejectDocument(documentId) {
    const documentReviews = loadFromStorage('documentReviews') || [];
    const docIndex = documentReviews.findIndex(doc => doc.id === documentId);
    
    if (docIndex !== -1) {
        documentReviews[docIndex].status = 'rejected';
        saveToStorage('documentReviews', documentReviews);
        
        showNotification('Document rejected', 'info');
        loadDocumentReviews();
        
        // Add to admin activities
        addToAdminActivities('rejection', `Document rejected: ${documentReviews[docIndex].title}`);
    }
}

// Load applications
function loadApplications() {
    const applications = loadFromStorage('applications') || [];
    
    const applicationsGrid = document.querySelector('.applications-grid');
    if (applicationsGrid) {
        if (applications.length === 0) {
            applicationsGrid.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666; grid-column: 1 / -1;">
                    <i class="fas fa-file-alt" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <h3>No applications yet</h3>
                    <p>Applications will appear here once clients start their visa process</p>
                </div>
            `;
        } else {
            applicationsGrid.innerHTML = applications.map(app => `
                <div class="application-card">
                    <div class="application-header">
                        <h4>${app.client} - ${app.country} ${app.visaType}</h4>
                        <span class="status-badge status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span>
                    </div>
                    <div class="application-details">
                        <p><strong>Country:</strong> ${app.country}</p>
                        <p><strong>Visa Type:</strong> ${app.visaType}</p>
                        <p><strong>Progress:</strong> ${app.progress}% Complete</p>
                        <p><strong>Next Step:</strong> ${app.nextStep}</p>
                    </div>
                    <div class="application-actions">
                        <button class="btn btn-small btn-primary" onclick="viewApplication('${app.id}')">View Details</button>
                        <button class="btn btn-small btn-outline" onclick="updateStatus('${app.id}')">Update Status</button>
                    </div>
                </div>
            `).join('');
        }
    }
}

// View application
function viewApplication(applicationId) {
    showNotification('Opening application details...', 'info');
    // Here you would typically open a modal with detailed application information
}

// Update status
function updateStatus(applicationId) {
    showNotification('Opening status update form...', 'info');
    // Here you would typically open a modal to update the application status
}

// Load communications
function loadCommunications() {
    const communications = loadFromStorage('adminCommunications') || [];
    
    const messageThreads = document.querySelector('.message-threads');
    if (messageThreads) {
        if (communications.length === 0) {
            messageThreads.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #666;">
                    <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; display: block;"></i>
                    <h3>No messages yet</h3>
                    <p>Client messages will appear here once they start communicating</p>
                </div>
            `;
        } else {
            messageThreads.innerHTML = communications.map(thread => `
                <div class="thread-item ${thread.active ? 'active' : ''}" onclick="selectThread('${thread.id}')">
                    <div class="thread-header">
                        <h4>${thread.client}</h4>
                        <span class="timestamp">${formatDate(thread.timestamp)}</span>
                    </div>
                    <div class="thread-preview">
                        <p>${thread.lastMessage}</p>
                    </div>
                    ${thread.unreadCount > 0 ? `<span class="unread-count">${thread.unreadCount}</span>` : ''}
                </div>
            `).join('');
        }
    }
}

// Select thread
function selectThread(threadId) {
    // Remove active class from all threads
    document.querySelectorAll('.thread-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Add active class to selected thread
    const selectedThread = document.querySelector(`[onclick="selectThread('${threadId}')"]`);
    if (selectedThread) {
        selectedThread.classList.add('active');
    }
    
    // Update compose header
    const composeHeader = document.querySelector('.compose-header h4');
    if (composeHeader) {
        const clientName = selectedThread.querySelector('h4').textContent;
        composeHeader.textContent = `Reply to ${clientName}`;
    }
}

// Handle admin message submit
function handleAdminMessageSubmit(e) {
    e.preventDefault();
    
    const messageInput = e.target.querySelector('textarea');
    const message = messageInput.value.trim();
    
    if (!message) {
        showNotification('Please enter a message', 'error');
        return;
    }
    
    // Add message to storage
    const adminMessages = loadFromStorage('adminMessages') || [];
    const newMessage = {
        id: Date.now().toString(),
        sender: 'Admin',
        message: message,
        timestamp: new Date().toISOString(),
        type: 'sent'
    };
    
    adminMessages.unshift(newMessage);
    saveToStorage('adminMessages', adminMessages);
    
    // Clear input
    messageInput.value = '';
    
    showNotification('Message sent successfully', 'success');
    
    // Add to admin activities
    addToAdminActivities('message', 'Message sent to client');
}

// Load reports
function loadReports() {
    const reports = {
        successRate: 0,
        averageProcessingTime: 0,
        countryDistribution: {
            'Australia': 0,
            'Canada': 0,
            'New Zealand': 0
        }
    };
    
    // Update report cards
    const reportCards = document.querySelectorAll('.report-card');
    reportCards.forEach((card, index) => {
        const chartElement = card.querySelector('[style*="text-align: center"]');
        if (chartElement) {
            switch(index) {
                case 0: // Success Rate
                    chartElement.innerHTML = `
                        <i class="fas fa-chart-pie"></i>
                        <p>${reports.successRate}% Success Rate</p>
                    `;
                    break;
                case 1: // Processing Times
                    chartElement.innerHTML = `
                        <i class="fas fa-chart-line"></i>
                        <p>Average: ${reports.averageProcessingTime} days</p>
                    `;
                    break;
                case 2: // Country Distribution
                    const distribution = Object.entries(reports.countryDistribution)
                        .map(([country, percentage]) => `${country}: ${percentage}%`)
                        .join('<br>');
                    chartElement.innerHTML = `
                        <i class="fas fa-chart-bar"></i>
                        <p>${distribution}</p>
                    `;
                    break;
            }
        }
    });
}

// Add to admin activities
function addToAdminActivities(type, message) {
    const activities = loadFromStorage('adminActivities') || [];
    const newActivity = {
        type: type,
        message: message,
        timestamp: new Date().toISOString()
    };
    
    activities.unshift(newActivity);
    
    // Keep only last 20 activities
    if (activities.length > 20) {
        activities.splice(20);
    }
    
    saveToStorage('adminActivities', activities);
}

// Get activity icon
function getActivityIcon(type) {
    const icons = {
        upload: 'file-upload',
        message: 'comment',
        approval: 'check',
        rejection: 'times',
        review: 'eye',
        submission: 'paper-plane'
    };
    return icons[type] || 'info-circle';
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
    localStorage.removeItem('adminSession');
    
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
window.viewClient = viewClient;
window.messageClient = messageClient;
window.previewDocument = previewDocument;
window.approveDocument = approveDocument;
window.rejectDocument = rejectDocument;
window.viewApplication = viewApplication;
window.updateStatus = updateStatus;
window.selectThread = selectThread;
window.logout = logout;