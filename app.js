import React, { useState, useRef, useEffect } from 'react';
import { Plus, Edit3, GripVertical, FolderOpen, Save, Download, Upload, ArrowLeft, Trash2 } from 'lucide-react';

const FictionCardOrganizer = () => {
  const [currentProject, setCurrentProject] = useState(null);
  const [projects, setProjects] = useState({});
  const [showProjectManager, setShowProjectManager] = useState(true);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [cards, setCards] = useState([]);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [editingCard, setEditingCard] = useState(null);
  const [editingProjectName, setEditingProjectName] = useState(null);
  const [newCard, setNewCard] = useState({ title: '', content: '' });
  const [showAddCard, setShowAddCard] = useState(false);
  const [showDeleteCardConfirm, setShowDeleteCardConfirm] = useState(null);
  const [editingProjectValue, setEditingProjectValue] = useState('');
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState(null);
  const [showCreateProject, setShowCreateProject] = useState(false);

  const cardRefs = useRef({});
  const fileInputRef = useRef(null);

  // Use in-memory storage instead of localStorage
  const [savedProjects, setSavedProjects] = useState({});

  // Load projects from memory on mount - removed this effect that was causing issues
  // useEffect(() => {
  //   setProjects(savedProjects);
  // }, [savedProjects]);

  // Save projects to memory whenever projects change - simplified
  useEffect(() => {
    setSavedProjects(projects);
  }, [projects]);

  // Auto-save current project when cards change
  useEffect(() => {
    if (currentProject && cards.length >= 0) {
      setProjects(prev => ({
        ...prev,
        [currentProject]: {
          ...prev[currentProject],
          cards: cards,
          lastModified: new Date().toISOString()
        }
      }));
    }
  }, [cards, currentProject]);

  const createNewProject = () => {
    if (newProjectName.trim()) {
      const projectId = Date.now().toString();
      const newProject = {
        id: projectId,
        name: newProjectName.trim(),
        cards: [
          { 
            id: 1, 
            title: "Welcome to your new project!", 
            content: "This is your first card. Click to edit it, or drag the + button above to add more cards.\n\n• Start outlining your chapters\n• Add scene breakdowns\n• Organize your story structure" 
          }
        ],
        created: new Date().toISOString(),
        lastModified: new Date().toISOString()
      };
      
      setProjects(prev => ({ ...prev, [projectId]: newProject }));
      setCurrentProject(projectId);
      setCards(newProject.cards);
      setNewProjectName('');
      setShowCreateProject(false);
      setShowProjectManager(false);
    }
  };

  const loadProject = (projectId) => {
    const project = projects[projectId];
    if (project) {
      setCurrentProject(projectId);
      setCards(project.cards || []);
      setShowProjectManager(false);
    }
  };

  const updateProjectName = (projectId, newName) => {
    if (newName.trim()) {
      setProjects(prev => ({
        ...prev,
        [projectId]: {
          ...prev[projectId],
          name: newName.trim(),
          lastModified: new Date().toISOString()
        }
      }));
    }
    setEditingProjectName(null);
    setEditingProjectValue('');
  };

  const deleteProject = (projectId) => {
    if (window.confirm('Are you sure you want to delete this project? This cannot be undone.')) {
      setProjects(prev => {
        const newProjects = { ...prev };
        delete newProjects[projectId];
        return newProjects;
      });
      
      if (currentProject === projectId) {
        setCurrentProject(null);
        setCards([]);
        setShowProjectManager(true);
      }
    }
  };

  const exportProject = () => {
    if (currentProject && projects[currentProject]) {
      const project = projects[currentProject];
      const dataStr = JSON.stringify(project, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  const importProject = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          const projectId = Date.now().toString();
          const importedProject = {
            ...imported,
            id: projectId,
            name: `${imported.name} (Imported)`,
            lastModified: new Date().toISOString()
          };
          
          setProjects(prev => ({ ...prev, [projectId]: importedProject }));
          alert('Project imported successfully!');
        } catch (error) {
          alert('Error importing project. Please check the file format.');
        }
      };
      reader.readAsText(file);
    }
    event.target.value = '';
  };

  const handleDragStart = (e, card, index) => {
    setDraggedCard({ card, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedCard && draggedCard.index !== dropIndex) {
      const newCards = [...cards];
      const [movedCard] = newCards.splice(draggedCard.index, 1);
      newCards.splice(dropIndex, 0, movedCard);
      setCards(newCards);
    }
    
    setDraggedCard(null);
    setDragOverIndex(null);
  };

  const handleCardEdit = (cardId, field, value) => {
    setCards(cards.map(card => 
      card.id === cardId ? { ...card, [field]: value } : card
    ));
  };

  const addNewCard = (insertIndex = null) => {
    if (newCard.title.trim() || newCard.content.trim()) {
      const newCardObj = {
        id: Date.now(),
        title: newCard.title || 'New Scene',
        content: newCard.content || 'Add your scene details here...'
      };
      
      const newCards = [...cards];
      if (insertIndex !== null) {
        newCards.splice(insertIndex, 0, newCardObj);
      } else {
        newCards.push(newCardObj);
      }
      
      setCards(newCards);
      setNewCard({ title: '', content: '' });
      setShowAddCard(false);
    }
  };

  const deleteCard = (cardId) => {
    if (showDeleteCardConfirm === cardId) {
      setCards(cards.filter(card => card.id !== cardId));
      setEditingCard(null);
      setShowDeleteCardConfirm(null);
    } else {
      setShowDeleteCardConfirm(cardId);
    }
  };

  const adjustFontSize = (text, maxLines = 10) => {
    const length = text.length;
    if (length < 100) return 'text-sm';
    if (length < 200) return 'text-xs';
    return 'text-xs leading-tight';
  };

  // Project Manager View
  if (showProjectManager) {
    return (
      <div className="min-h-screen bg-amber-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-amber-900 mb-2">Story Cards</h1>
            <p className="text-amber-800">Manage your story projects</p>
          </div>

          {/* Existing Projects */}
          {Object.keys(projects).length > 0 ? (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Your Projects</h2>
              <div className="grid gap-4">
                {Object.values(projects)
                  .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
                  .map((project) => (
                  <div 
                    key={project.id} 
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => loadProject(project.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {editingProjectName === project.id ? (
                            <div className="flex items-center gap-2 flex-1">
                              <input
                                type="text"
                                value={editingProjectValue}
                                onChange={(e) => setEditingProjectValue(e.target.value)}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter') {
                                    console.log('Enter pressed, updating:', project.id, 'to:', editingProjectValue.trim());
                                    if (editingProjectValue.trim()) {
                                      // Force re-render with new object reference
                                      setProjects(currentProjects => {
                                        const newProjects = {};
                                        Object.keys(currentProjects).forEach(key => {
                                          if (key === project.id) {
                                            newProjects[key] = {
                                              ...currentProjects[key],
                                              name: editingProjectValue.trim(),
                                              lastModified: new Date().toISOString()
                                            };
                                          } else {
                                            newProjects[key] = currentProjects[key];
                                          }
                                        });
                                        console.log('New projects state:', newProjects);
                                        return newProjects;
                                      });
                                    }
                                    setEditingProjectName(null);
                                    setEditingProjectValue('');
                                  }
                                  if (e.key === 'Escape') {
                                    setEditingProjectName(null);
                                    setEditingProjectValue('');
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="text-lg font-semibold text-gray-800 bg-white border border-gray-400 rounded px-2 py-1 outline-none flex-1"
                                autoFocus
                              />
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  console.log('Save clicked, updating:', project.id, 'to:', editingProjectValue.trim());
                                  if (editingProjectValue.trim()) {
                                    // Force re-render with new object reference
                                    setProjects(currentProjects => {
                                      const newProjects = {};
                                      Object.keys(currentProjects).forEach(key => {
                                        if (key === project.id) {
                                          newProjects[key] = {
                                            ...currentProjects[key],
                                            name: editingProjectValue.trim(),
                                            lastModified: new Date().toISOString()
                                          };
                                        } else {
                                          newProjects[key] = currentProjects[key];
                                        }
                                      });
                                      console.log('New projects state:', newProjects);
                                      return newProjects;
                                    });
                                  }
                                  setEditingProjectName(null);
                                  setEditingProjectValue('');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProjectName(null);
                                  setEditingProjectValue('');
                                }}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <>
                              <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                                {project.name}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingProjectName(project.id);
                                  setEditingProjectValue(project.name);
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-600 px-2 py-1 rounded text-xs transition-colors flex items-center gap-1"
                              >
                                <Edit3 size={10} />
                                Rename
                              </button>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {project.cards?.length || 0} cards • Last modified: {new Date(project.lastModified).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Created: {new Date(project.created).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const tempCurrentProject = currentProject;
                            const tempCards = cards;
                            setCurrentProject(project.id);
                            setCards(project.cards || []);
                            
                            // Create and trigger download
                            const dataStr = JSON.stringify(project, null, 2);
                            const dataBlob = new Blob([dataStr], { type: 'application/json' });
                            const url = URL.createObjectURL(dataBlob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `${project.name.replace(/[^a-z0-9]/gi, '_')}.json`;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            URL.revokeObjectURL(url);
                            
                            // Restore previous state
                            setCurrentProject(tempCurrentProject);
                            setCards(tempCards);
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                        >
                          <Download size={12} />
                          Export
                        </button>
                        {showDeleteProjectConfirm === project.id ? (
                          <div className="flex items-center gap-2 bg-red-50 p-2 rounded">
                            <span className="text-sm text-red-700">Delete this project?</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                console.log('Confirming delete for project:', project.id);
                                
                                // Force re-render with completely new object reference
                                setProjects(currentProjects => {
                                  const newProjects = {};
                                  Object.keys(currentProjects).forEach(key => {
                                    if (key !== project.id) {
                                      newProjects[key] = currentProjects[key];
                                    }
                                  });
                                  console.log('New projects after delete:', newProjects);
                                  return newProjects;
                                });
                                
                                // Clear current project if it was the deleted one
                                if (currentProject === project.id) {
                                  setCurrentProject(null);
                                  setCards([]);
                                  setShowProjectManager(true);
                                }
                                setShowDeleteProjectConfirm(null);
                              }}
                              className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              Yes
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowDeleteProjectConfirm(null);
                              }}
                              className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteProjectConfirm(project.id);
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors flex items-center gap-1"
                          >
                            <Trash2 size={12} />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Add New Project Button */}
              <div className="flex justify-center mt-4">
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl"
                  title="Create New Project"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="text-center py-12 text-gray-500">
                <FolderOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p className="mb-4">No projects yet. Create your first project!</p>
                <button
                  onClick={() => setShowCreateProject(true)}
                  className="bg-amber-600 hover:bg-amber-700 text-white w-12 h-12 rounded-full flex items-center justify-center transition-colors shadow-lg hover:shadow-xl mx-auto"
                  title="Create New Project"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          )}

          {/* Create New Project Popup */}
          {showCreateProject && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-90vw">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Create New Project</h2>
                <input
                  type="text"
                  placeholder="Enter project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createNewProject()}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
                  id="new-project-popup-input"
                  name="projectName"
                  autoFocus
                />
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowCreateProject(false);
                      setNewProjectName('');
                    }}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createNewProject}
                    disabled={!newProjectName.trim()}
                    className="bg-amber-700 hover:bg-amber-800 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main Card Organizer View
  return (
    <div className="min-h-screen" style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D2B48C' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='7' r='1'/%3E%3Ccircle cx='47' cy='7' r='1'/%3E%3Ccircle cx='7' cy='27' r='1'/%3E%3Ccircle cx='27' cy='27' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='7' cy='47' r='1'/%3E%3Ccircle cx='27' cy='47' r='1'/%3E%3Ccircle cx='47' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      backgroundColor: '#D2B48C'
    }}>
      <div className="p-6">
        <div className="mb-6 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => setShowProjectManager(true)}
              className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <ArrowLeft size={16} />
              Projects
            </button>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-amber-900 select-text">
                {projects[currentProject]?.name || 'Untitled Project'}
              </h1>
              <p className="text-amber-800 text-sm">
                {cards.length} scenes • Auto-saved
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportProject}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download size={16} />
                Export
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setShowAddCard(!showAddCard)}
            className="bg-amber-700 hover:bg-amber-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-colors"
          >
            <Plus size={16} />
            Add New Card
          </button>
        </div>

        {showAddCard && (
          <div className="mb-6 max-w-md mx-auto bg-white p-4 rounded-lg shadow-lg border border-gray-200">
            <input
              type="text"
              placeholder="Card title..."
              value={newCard.title}
              onChange={(e) => setNewCard({ ...newCard, title: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded mb-2 font-bold"
            />
            <textarea
              placeholder="Card content..."
              value={newCard.content}
              onChange={(e) => setNewCard({ ...newCard, content: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded h-24 resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => addNewCard()}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Add Card
              </button>
              <button
                onClick={() => setShowAddCard(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div 
          className="flex flex-wrap gap-4 max-h-[70vh] overflow-y-auto p-4 justify-center"
          style={{ 
            alignContent: 'flex-start'
          }}
        >
          {cards.map((card, index) => (
            <div
              key={card.id}
              ref={el => cardRefs.current[card.id] = el}
              draggable
              onDragStart={(e) => handleDragStart(e, card, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={`
                bg-white shadow-lg cursor-move transition-all duration-200 hover:shadow-xl
                ${dragOverIndex === index ? 'transform scale-105 ring-2 ring-blue-400' : ''}
                ${draggedCard?.index === index ? 'opacity-50' : ''}
              `}
              style={{
                width: '200px',
                height: '250px',
                backgroundImage: `repeating-linear-gradient(
                  transparent,
                  transparent 19px,
                  #e5e7eb 19px,
                  #e5e7eb 20px
                )`,
                paddingTop: '30px',
                position: 'relative'
              }}
            >
              {/* Pink header line */}
              <div 
                className="absolute top-0 left-0 right-0 bg-pink-300"
                style={{ height: '3px', marginTop: '22px' }}
              />
              
              {/* Drag handle */}
              <div className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                <GripVertical size={14} />
              </div>

              {/* Card content */}
              <div className="p-3 h-full flex flex-col">
                {editingCard === card.id ? (
                  <div className="flex flex-col h-full">
                    <input
                      type="text"
                      value={card.title}
                      onChange={(e) => handleCardEdit(card.id, 'title', e.target.value)}
                      className="font-bold text-sm mb-2 bg-transparent border-none outline-none"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                      autoFocus
                    />
                    <textarea
                      value={card.content}
                      onChange={(e) => handleCardEdit(card.id, 'content', e.target.value)}
                      className="flex-1 bg-transparent border-none outline-none resize-none text-xs leading-relaxed"
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setEditingCard(null)}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
                      >
                        Save
                      </button>
                      {showDeleteCardConfirm === card.id ? (
                        <div className="flex gap-1">
                          <span className="text-xs text-red-600 mr-2">Delete this card?</span>
                          <button
                            onClick={() => deleteCard(card.id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setShowDeleteCardConfirm(null)}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => deleteCard(card.id)}
                          className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex flex-col h-full cursor-text"
                    onClick={() => setEditingCard(card.id)}
                  >
                    <h3 
                      className={`font-bold mb-2 ${adjustFontSize(card.title)}`}
                      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    >
                      {card.title}
                    </h3>
                    <div 
                      className={`flex-1 whitespace-pre-wrap ${adjustFontSize(card.content)}`}
                      style={{ 
                        fontFamily: 'system-ui, -apple-system, sans-serif',
                        lineHeight: '1.4'
                      }}
                    >
                      {card.content}
                    </div>
                    <div className="absolute top-2 left-2 opacity-0 hover:opacity-100 transition-opacity">
                      <Edit3 size={12} className="text-gray-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-12 text-amber-800">
            <p className="text-lg">No cards yet. Click "Add New Card" to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FictionCardOrganizer;
