<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Story Cards</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif; }
        #root { min-height: 100vh; }
        .card-background {
            background-image: repeating-linear-gradient(
                transparent,
                transparent 19px,
                #e5e7eb 19px,
                #e5e7eb 20px
            );
            padding-top: 30px;
            position: relative;
        }
        .card-header-line {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            background-color: #f9a8d4;
            height: 3px;
            margin-top: 22px;
        }
        .dot-background {
            background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D2B48C' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
            background-color: #D2B48C;
        }
    </style>
</head>
<body>
    <div id="root"></div>
    
    <script>
        // Simple Story Cards App - No external dependencies
        
        class StoryCardsApp {
            constructor() {
                this.projects = {};
                this.currentProject = null;
                this.cards = [];
                this.showProjectManager = true;
                this.editingCard = null;
                this.editingProject = null;
                this.showCreateProject = false;
                this.syncStatus = 'idle';
                this.isOnline = navigator.onLine;
                this.draggedCard = null;
                
                this.loadData();
                this.render();
                this.setupEventListeners();
            }
            
            loadData() {
                try {
                    const saved = localStorage.getItem('storyCardsProjects');
                    if (saved) {
                        this.projects = JSON.parse(saved);
                    }
                } catch (error) {
                    console.error('Error loading data:', error);
                }
            }
            
            saveData() {
                try {
                    localStorage.setItem('storyCardsProjects', JSON.stringify(this.projects));
                    this.syncToGitHub();
                } catch (error) {
                    console.error('Error saving data:', error);
                }
            }
            
            async syncToGitHub() {
                if (!this.isOnline || Object.keys(this.projects).length === 0) return;
                
                try {
                    this.syncStatus = 'syncing';
                    this.updateSyncIndicator();
                    
                    // Get current file SHA
                    let sha = null;
                    try {
                        const getCurrentFile = await fetch(
                            'https://api.github.com/repos/yexod/story-cards/contents/data.json'
                        );
                        if (getCurrentFile.ok) {
                            const currentData = await getCurrentFile.json();
                            sha = currentData.sha;
                        }
                    } catch (error) {
                        // File might not exist yet
                    }
                    
                    const content = btoa(JSON.stringify(this.projects, null, 2));
                    const updateData = {
                        message: `Update story cards data - ${new Date().toISOString()}`,
                        content: content,
                        branch: 'main'
                    };
                    
                    if (sha) updateData.sha = sha;
                    
                    const response = await fetch(
                        'https://api.github.com/repos/yexod/story-cards/contents/data.json',
                        {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(updateData)
                        }
                    );
                    
                    if (response.ok) {
                        this.syncStatus = 'synced';
                    } else {
                        this.syncStatus = 'error';
                    }
                } catch (error) {
                    this.syncStatus = 'error';
                    console.error('Sync error:', error);
                }
                
                this.updateSyncIndicator();
            }
            
            setupEventListeners() {
                window.addEventListener('online', () => {
                    this.isOnline = true;
                    this.syncToGitHub();
                });
                
                window.addEventListener('offline', () => {
                    this.isOnline = false;
                    this.updateSyncIndicator();
                });
            }
            
            createProject(name) {
                if (!name.trim()) return;
                
                const id = Date.now().toString();
                const newProject = {
                    id: id,
                    name: name.trim(),
                    cards: [{
                        id: 1,
                        title: "Welcome to your new project!",
                        content: "This is your first card. Click to edit it.\n\n• Start outlining your chapters\n• Add scene breakdowns\n• Organize your story structure"
                    }],
                    created: new Date().toISOString(),
                    lastModified: new Date().toISOString()
                };
                
                this.projects[id] = newProject;
                this.currentProject = id;
                this.cards = [...newProject.cards];
                this.showProjectManager = false;
                this.showCreateProject = false;
                
                this.saveData();
                this.render();
            }
            
            loadProject(id) {
                const project = this.projects[id];
                if (project) {
                    this.currentProject = id;
                    this.cards = [...project.cards];
                    this.showProjectManager = false;
                    this.render();
                }
            }
            
            addCard() {
                const newCard = {
                    id: Date.now(),
                    title: '',  // Empty string instead of 'New Scene'
                    content: '', // Empty string instead of placeholder text
                    isPlaceholder: true // Flag to track if it's still using placeholders
                };
                
                this.cards.push(newCard);
                this.updateCurrentProject();
                this.render();
            }
            
            updateCard(cardId, field, value) {
                this.cards = this.cards.map(card => {
                    if (card.id === cardId) {
                        const updatedCard = { ...card, [field]: value };
                        // Remove placeholder flag once user starts typing
                        if (value.trim()) {
                            updatedCard.isPlaceholder = false;
                        }
                        return updatedCard;
                    }
                    return card;
                });
                this.updateCurrentProject();
            }

            handleRealTimeInput(cardId, field, value, inputElement) {
                // Update the card data
                this.cards = this.cards.map(card => {
                    if (card.id === cardId) {
                        const updatedCard = { ...card, [field]: value };
                        // Remove placeholder flag once user starts typing
                        if (value.trim()) {
                            updatedCard.isPlaceholder = false;
                        }
                        return updatedCard;
                    }
                    return card;
                });
                
                // Immediately update the text color based on content
                if (value.trim()) {
                    // User has typed something - make it black
                    inputElement.className = inputElement.className.replace('text-gray-400', 'text-black');
                } else {
                    // User cleared the field - make it gray again
                    inputElement.className = inputElement.className.replace('text-black', 'text-gray-400');
                }
                
                // Save the data (but don't re-render to avoid losing focus)
                this.updateCurrentProject();
            }
            
            deleteCard(cardId) {
                this.cards = this.cards.filter(card => card.id !== cardId);
                this.editingCard = null;
                this.updateCurrentProject();
                this.render();
            }
            
            updateCurrentProject() {
                if (this.currentProject) {
                    this.projects[this.currentProject] = {
                        ...this.projects[this.currentProject],
                        cards: this.cards,
                        lastModified: new Date().toISOString()
                    };
                    this.saveData();
                }
            }
            
            updateSyncIndicator() {
                const indicator = document.getElementById('sync-indicator');
                if (indicator) {
                    let status = 'Ready';
                    let color = 'text-green-500';
                    
                    if (!this.isOnline) {
                        status = 'Offline';
                        color = 'text-red-500';
                    } else if (this.syncStatus === 'syncing') {
                        status = 'Syncing...';
                        color = 'text-blue-500';
                    } else if (this.syncStatus === 'error') {
                        status = 'Sync Error';
                        color = 'text-yellow-500';
                    }
                    
                    indicator.className = `text-xs ${color}`;
                    indicator.textContent = status;
                }
            }
            
            render() {
                const root = document.getElementById('root');
                
                if (this.showProjectManager) {
                    root.innerHTML = this.renderProjectManager();
                } else {
                    root.innerHTML = this.renderCardView();
                }
                
                this.attachEventListeners();
                this.updateSyncIndicator();
            }
            
            renderProjectManager() {
                const projectsList = Object.values(this.projects)
                    .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
                    .map(project => `
                        <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer group" onclick="app.loadProject('${project.id}')">
                            <div class="flex justify-between items-start">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        ${this.editingProject === project.id ? `
                                            <input type="text" id="edit-project-${project.id}" value="${project.name}" class="text-lg font-semibold text-gray-800 bg-white border border-gray-400 rounded px-2 py-1 outline-none flex-1" onclick="event.stopPropagation()">
                                            <button onclick="event.stopPropagation(); app.saveProjectName('${project.id}')" class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors">Save</button>
                                            <button onclick="event.stopPropagation(); app.editingProject = null; app.render()" class="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors">Cancel</button>
                                        ` : `
                                            <h3 class="text-lg font-semibold text-gray-800">${project.name}</h3>
                                            <button onclick="event.stopPropagation(); app.editingProject = '${project.id}'; app.render()" class="bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded text-xs transition-colors flex items-center gap-1">
                                                ✏️ Rename
                                            </button>
                                        `}
                                    </div>
                                    <p class="text-sm text-gray-600 mt-1">
                                        ${project.cards?.length || 0} cards • Last modified: ${new Date(project.lastModified).toLocaleDateString()}
                                    </p>
                                </div>
                                <div class="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onclick="event.stopPropagation(); app.exportProject('${project.id}')" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors">
                                        Export
                                    </button>
                                    <button onclick="event.stopPropagation(); app.deleteProject('${project.id}')" class="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('');
                
                const hasProjects = Object.keys(this.projects).length > 0;
                
                return `
                    <div class="min-h-screen bg-amber-50 p-6">
                        <div class="max-w-4xl mx-auto">
                            <div class="text-center mb-8">
                                <h1 class="text-4xl font-bold text-amber-900 mb-2">Story Cards</h1>
                                <p class="text-amber-800">Manage your story projects</p>
                                <div class="mt-2">
                                    <span id="sync-indicator" class="text-xs text-green-500">Ready</span>
                                </div>
                            </div>
                            
                            ${hasProjects ? `
                                <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                                    <h2 class="text-xl font-bold text-gray-800 mb-4">Your Projects</h2>
                                    <div class="grid gap-4">
                                        ${projectsList}
                                    </div>
                                    <div class="flex justify-center mt-4">
                                        <button onclick="app.showCreateProject = true; app.render()" class="bg-amber-600 hover:bg-amber-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl">
                                            <span class="text-2xl">+</span>
                                        </button>
                                    </div>
                                </div>
                            ` : `
                                <div class="bg-white rounded-lg shadow-lg p-6 mb-6">
                                    <div class="text-center py-12 text-gray-500">
                                        <div class="text-5xl mb-4">📁</div>
                                        <p class="mb-4">No projects yet. Create your first project!</p>
                                        <button onclick="app.showCreateProject = true; app.render()" class="bg-amber-600 hover:bg-amber-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl mx-auto">
                                            <span class="text-2xl">+</span>
                                        </button>
                                    </div>
                                </div>
                            `}
                            
                            ${this.showCreateProject ? `
                                <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                    <div class="bg-white rounded-lg shadow-xl p-6 w-96 max-w-90vw">
                                        <h2 class="text-xl font-bold text-gray-800 mb-4">Create New Project</h2>
                                        <input type="text" id="project-name-input" placeholder="Enter project name..." class="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4">
                                        <div class="flex gap-3 justify-end">
                                            <button onclick="app.showCreateProject = false; app.render()" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors">
                                                Cancel
                                            </button>
                                            <button onclick="app.createProjectFromInput()" class="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                                                Create
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            renderCardView() {
                const currentProjectName = this.projects[this.currentProject]?.name || 'Untitled Project';
                
                const cardsList = this.cards.map((card, index) => {
                    // Determine display values and placeholder status
                    const displayTitle = card.title || (card.isPlaceholder ? 'New Scene' : '');
                    const displayContent = card.content || (card.isPlaceholder ? 'Add your scene details here...' : '');
                    const displayTitleClass = card.isPlaceholder && !card.title ? 'font-bold mb-2 text-sm text-gray-400' : 'font-bold mb-2 text-sm';
                    const displayContentClass = card.isPlaceholder && !card.content ? 'flex-1 whitespace-pre-wrap text-xs text-gray-400' : 'flex-1 whitespace-pre-wrap text-xs';
                
                    return `
                        <div class="bg-white shadow-lg cursor-move transition-all duration-200 hover:shadow-xl card-background" 
                             style="width: 350px; height: 250px;" 
                             draggable="true" 
                             ondragstart="app.handleDragStart(event, ${card.id}, ${index})"
                             ondragover="app.handleDragOver(event, ${index})"
                             ondrop="app.handleDrop(event, ${index})"
                             ondragenter="event.preventDefault()"
                             ondragleave="app.handleDragLeave(event)"
                             id="card-${card.id}">
                            <div class="card-header-line"></div>
                            <div class="absolute top-2 right-2 text-gray-400" style="cursor: grab;">⋮⋮</div>
                            
                            <div class="p-3 h-full flex flex-col">
                                ${this.editingCard === card.id ? `
                                    <input type="text" 
                                           id="title-input-${card.id}"
                                           value="${card.title}" 
                                           placeholder="New Scene"
                                           onchange="app.updateCard(${card.id}, 'title', this.value)" 
                                           oninput="app.handleRealTimeInput(${card.id}, 'title', this.value, this)"
                                           onfocus="if(this.value === '' && app.cards.find(c => c.id === ${card.id}).isPlaceholder) this.value = ''"
                                           class="font-bold text-sm mb-2 bg-transparent border-none outline-none ${card.isPlaceholder && !card.title ? 'text-gray-400' : 'text-black'}" 
                                           style="font-family: system-ui;">
                                    <textarea id="content-input-${card.id}"
                                              placeholder="Add your scene details here..." 
                                              onchange="app.updateCard(${card.id}, 'content', this.value)" 
                                              oninput="app.handleRealTimeInput(${card.id}, 'content', this.value, this)"
                                              onfocus="if(this.value === '' && app.cards.find(c => c.id === ${card.id}).isPlaceholder) this.value = ''"
                                              class="flex-1 bg-transparent border-none outline-none resize-none text-xs leading-relaxed ${card.isPlaceholder && !card.content ? 'text-gray-400' : 'text-black'}" 
                                              style="font-family: system-ui;">${card.content}</textarea>
                                    <div class="flex gap-2 mt-2">
                                        <button onclick="app.editingCard = null; app.render()" class="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors">Save</button>
                                        <button onclick="if(confirm('Delete this card?')) app.deleteCard(${card.id})" class="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors">Delete</button>
                                    </div>
                                ` : `
                                    <div class="flex flex-col h-full cursor-text" onclick="app.editingCard = ${card.id}; app.render()">
                                        <h3 class="${displayTitleClass}" style="font-family: system-ui;">${displayTitle}</h3>
                                        <div class="${displayContentClass}" style="font-family: system-ui; line-height: 1.4;">${displayContent}</div>
                                    </div>
                                `}
                            </div>
                        </div>
                    `;
                }).join('');
                
                return `
                    <div class="min-h-screen dot-background">
                        <div class="p-6">
                            <div class="mb-6 text-center">
                                <div class="flex items-center justify-center gap-4 mb-4">
                                    <button onclick="app.showProjectManager = true; app.render()" class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                                        ← Projects
                                    </button>
                                    <div class="text-center">
                                        <h1 class="text-3xl font-bold text-amber-900">${currentProjectName}</h1>
                                        <p class="text-amber-800 text-sm">
                                            ${this.cards.length} scenes • <span id="sync-indicator" class="text-xs text-green-500">Ready</span>
                                        </p>
                                    </div>
                                    <button onclick="app.exportCurrentProject()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                                        Export
                                    </button>
                                </div>
                                
                                <button onclick="app.addCard()" class="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg transition-colors">
                                    + Add New Card
                                </button>
                            </div>
                            
                            <div class="flex flex-wrap gap-4 max-h-[70vh] overflow-y-auto p-4 justify-center" style="align-content: flex-start;">
                                ${cardsList}
                            </div>
                            
                            ${this.cards.length === 0 ? `
                                <div class="text-center py-12 text-amber-800">
                                    <p class="text-lg">No cards yet. Click "Add New Card" to get started!</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
            }
            
            attachEventListeners() {
                // Add keyboard event listener for create project
                const input = document.getElementById('project-name-input');
                if (input) {
                    input.focus();
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            this.createProjectFromInput();
                        }
                    });
                }
            }
            
            createProjectFromInput() {
                const input = document.getElementById('project-name-input');
                if (input && input.value.trim()) {
                    this.createProject(input.value);
                }
            }
            
            deleteProject(id) {
                if (confirm('Are you sure you want to delete this project? This cannot be undone.')) {
                    delete this.projects[id];
                    if (this.currentProject === id) {
                        this.currentProject = null;
                        this.cards = [];
                        this.showProjectManager = true;
                    }
                    this.saveData();
                    this.render();
                }
            }

            saveProjectName(id) {
                const input = document.getElementById(`edit-project-${id}`);
                if (input && input.value.trim()) {
                    this.projects[id] = {
                        ...this.projects[id],
                        name: input.value.trim(),
                        lastModified: new Date().toISOString()
                    };
                    this.editingProject = null;
                    this.saveData();
                    this.render();
                }
            }

            handleDragStart(event, cardId, index) {
                this.draggedCard = { cardId, index };
                event.dataTransfer.effectAllowed = 'move';
                event.target.style.opacity = '0.5';
            }
            
            handleDragOver(event, index) {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                
                // Visual feedback
                const cards = document.querySelectorAll('[id^="card-"]');
                cards.forEach(card => card.style.transform = '');
                
                if (this.draggedCard && this.draggedCard.index !== index) {
                    const targetCard = document.getElementById(`card-${this.cards[index].id}`);
                    if (targetCard) {
                        targetCard.style.transform = 'scale(1.05)';
                        targetCard.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
                    }
                }
            }
            
            handleDragLeave(event) {
                const targetCard = event.target.closest('[id^="card-"]');
                if (targetCard) {
                    targetCard.style.transform = '';
                    targetCard.style.boxShadow = '';
                }
            }
            
            handleDrop(event, dropIndex) {
                event.preventDefault();
                
                // Clear visual feedback
                const cards = document.querySelectorAll('[id^="card-"]');
                cards.forEach(card => {
                    card.style.opacity = '';
                    card.style.transform = '';
                    card.style.boxShadow = '';
                });
                
                if (this.draggedCard && this.draggedCard.index !== dropIndex) {
                    const newCards = [...this.cards];
                    const [movedCard] = newCards.splice(this.draggedCard.index, 1);
                    newCards.splice(dropIndex, 0, movedCard);
                    
                    this.cards = newCards;
                    this.updateCurrentProject();
                    this.render();
                }
                
                this.draggedCard = null;
            }
                        
            exportProject(id) {
                const project = this.projects[id];
                if (project) {
                    const dataStr = JSON.stringify(project, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            }
            
            exportCurrentProject() {
                if (this.currentProject) {
                    this.exportProject(this.currentProject);
                }
            }
        }
        
        // Initialize the app
        const app = new StoryCardsApp();
    </script>
</body>
</html>
