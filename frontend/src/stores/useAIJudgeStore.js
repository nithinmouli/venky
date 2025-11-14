import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import io from 'socket.io-client';
import axios from 'axios';

// API base URL
const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

const useAIJudgeStore = create(devtools((set, get) => ({
  // State
  currentCase: null,
  cases: [],
  isLoading: false,
  error: null,
  socket: null,
  
  // Upload state
  uploadProgress: {},
  isUploading: false,
  
  // UI state
  selectedSide: 'A', // A or B
  showArgumentModal: false,
  argumentText: '',
  
  // Statistics
  stats: null,

  // Actions
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
  setLoading: (loading) => set({ isLoading: loading }),
  
  // WebSocket actions
  connectSocket: () => {
    const socket = io('http://localhost:3001');
    set({ socket });
    
    socket.on('connect', () => {});
    
    socket.on('verdictRendered', (data) => {
      const { currentCase } = get();
      if (currentCase && currentCase.caseId === data.caseId) {
        set({
          currentCase: {
            ...currentCase,
            verdict: data.verdict,
            status: 'verdict_rendered'
          }
        });
      }
    });
    
    socket.on('newArgument', (data) => {
      const { currentCase } = get();
      if (currentCase && currentCase.caseId === data.caseId) {
        const newArgument = {
          side: data.side,
          argument: data.argument,
          aiResponse: data.aiResponse,
          argumentNumber: data.argumentNumber,
          timestamp: new Date().toISOString()
        };
        
        set({
          currentCase: {
            ...currentCase,
            arguments: [...(currentCase.arguments || []), newArgument],
            metadata: {
              ...currentCase.metadata,
              totalArguments: (currentCase.metadata?.totalArguments || 0) + 1,
              [`side${data.side}Arguments`]: (currentCase.metadata?.[`side${data.side}Arguments`] || 0) + 1
            }
          }
        });
      }
    });
  },
  
  disconnectSocket: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null });
    }
  },
  
  joinCase: (caseId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('joinCase', caseId);
    }
  },
  
  leaveCase: (caseId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leaveCase', caseId);
    }
  },

  // Case management actions
  createCase: async (caseData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/case/create', caseData);
      const newCase = response.data.case;
      
      set({
        currentCase: newCase,
        cases: [...get().cases, newCase],
        isLoading: false
      });
      
      // Join the case room
      get().joinCase(newCase.caseId);
      
      return newCase;
    } catch (error) {
      console.error('Error creating case:', error);
      set({
        error: error.response?.data?.error || 'Failed to create case',
        isLoading: false
      });
      throw error;
    }
  },
  
  loadCase: async (caseId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/case/${caseId}`);
      const caseData = response.data;
      
      set({
        currentCase: caseData,
        isLoading: false
      });
      
      get().joinCase(caseId);
      
      return caseData;
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to load case',
        isLoading: false
      });
      throw error;
    }
  },
  
  loadAllCases: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/cases');
      set({
        cases: response.data,
        isLoading: false
      });
      return response.data;
    } catch (error) {
      console.error('Error loading cases:', error);
      set({
        error: error.response?.data?.error || 'Failed to load cases',
        isLoading: false
      });
      throw error;
    }
  },
  
  deleteCase: async (caseId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/case/${caseId}`);
      
      set({
        cases: get().cases.filter(c => c.caseId !== caseId),
        currentCase: get().currentCase?.caseId === caseId ? null : get().currentCase,
        isLoading: false
      });
      
      // Leave the case room
      get().leaveCase(caseId);
    } catch (error) {
      console.error('Error deleting case:', error);
      set({
        error: error.response?.data?.error || 'Failed to delete case',
        isLoading: false
      });
      throw error;
    }
  },

  // Document upload actions
  uploadDocuments: async (caseId, side, files, description) => {
    set({ isUploading: true, uploadProgress: {}, error: null });
    
    try {
      const formData = new FormData();
      formData.append('caseId', caseId);
      formData.append('description', description);
      
      Array.from(files).forEach(file => {
        formData.append('documents', file);
      });
      
      const endpoint = side === 'A' ? '/upload/side-a' : '/upload/side-b';
      
      const response = await api.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          set({ uploadProgress: { [side]: progress } });
        }
      });
      
      if (get().currentCase?.caseId === caseId) {
        await get().loadCase(caseId);
      }
      
      set({
        isUploading: false,
        uploadProgress: {}
      });
      
      return response.data;
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Failed to upload documents',
        isUploading: false,
        uploadProgress: {}
      });
      throw error;
    }
  },

  // AI Judge actions
  requestVerdict: async (caseId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/case/${caseId}/judge`);
      const verdict = response.data.verdict;
      
      // Update current case
      if (get().currentCase?.caseId === caseId) {
        set({
          currentCase: {
            ...get().currentCase,
            verdict: verdict,
            status: 'verdict_rendered'
          }
        });
      }
      
      set({ isLoading: false });
      return verdict;
    } catch (error) {
      console.error('Error requesting verdict:', error);
      set({
        error: error.response?.data?.error || 'Failed to request verdict',
        isLoading: false
      });
      throw error;
    }
  },
  
  submitArgument: async (caseId, side, argument) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(`/case/${caseId}/argue`, {
        side,
        argument
      });
      
      // The response will come via WebSocket, so we don't need to manually update
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error submitting argument:', error);
      set({
        error: error.response?.data?.error || 'Failed to submit argument',
        isLoading: false
      });
      throw error;
    }
  },

  // Statistics
  loadStats: async () => {
    try {
      const response = await api.get('/stats');
      set({ stats: response.data });
      return response.data;
    } catch (error) {
      console.error('Error loading stats:', error);
      set({ error: 'Failed to load statistics' });
      throw error;
    }
  },

  // UI actions
  setSelectedSide: (side) => set({ selectedSide: side }),
  setShowArgumentModal: (show) => set({ showArgumentModal: show }),
  setArgumentText: (text) => set({ argumentText: text }),
  
  // Utility functions
  canSubmitArgument: (side) => {
    const { currentCase } = get();
    if (!currentCase || !currentCase.verdict) return false;
    
    const sideArguments = (currentCase.arguments || []).filter(arg => arg.side === side);
    return sideArguments.length < 5;
  },
  
  getRemainingArguments: (side) => {
    const { currentCase } = get();
    if (!currentCase) return 0;
    
    const sideArguments = (currentCase.arguments || []).filter(arg => arg.side === side);
    return 5 - sideArguments.length;
  },
  
  getBothSidesUploaded: () => {
    const { currentCase } = get();
    if (!currentCase) return false;
    
    return (
      currentCase.sideA?.documents?.length > 0 &&
      currentCase.sideB?.documents?.length > 0
    );
  }
}), {
  name: 'ai-judge-store'
}));

export default useAIJudgeStore;