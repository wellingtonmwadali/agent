import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  LinearProgress,
  Stack
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  WhatsApp,
  Email,
  Analytics
} from '@mui/icons-material';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import './App.css';

interface AgentStatus {
  agentRunning: boolean;
  whatsappConnected: boolean;
  stats: {
    totalProcessed?: number;
    leadsGenerated?: number;
    emailsSent?: number;
    whatsappMessagesSent?: number;
  };
  timestamp: string;
}

interface Config {
  businessTypes: string[];
  locations: string[];
  searchTerms: string[];
}

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [businessType, setBusinessType] = useState('');
  const [location, setLocation] = useState('');
  const [maxResults, setMaxResults] = useState(50);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(API_URL);
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server');
    });

    newSocket.on('agent-status', (status: AgentStatus) => {
      setAgentStatus(status);
      if (!status.agentRunning) {
        setProgress(0);
      }
    });

    newSocket.on('progress', (stats: any) => {
      setAgentStatus(prev => prev ? { ...prev, stats } : null);
      if (stats.totalProcessed && maxResults) {
        setProgress((stats.totalProcessed / maxResults) * 100);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    // Fetch initial data
    fetchStatus();
    fetchConfig();

    return () => {
      newSocket.close();
    };
  }, [maxResults]);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/status`);
      setAgentStatus(response.data);
    } catch (err) {
      console.error('Failed to fetch status:', err);
      setError('Failed to connect to server');
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/config`);
      setConfig(response.data);
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const startAgent = async () => {
    if (!businessType || !location) {
      setError('Please select business type and location');
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      await axios.post(`${API_URL}/api/start-agent`, {
        businessType,
        location,
        maxResults
      });
      setSuccess('Agent started successfully!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to start agent');
    } finally {
      setLoading(false);
    }
  };

  const stopAgent = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/stop-agent`);
      setSuccess('Agent stopped successfully!');
      setProgress(0);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to stop agent');
    } finally {
      setLoading(false);
    }
  };

  const connectWhatsApp = async () => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/whatsapp/connect`);
      setSuccess('WhatsApp connection initiated!');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to connect WhatsApp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center">
        Kidanga Lead Generation Agent
      </Typography>
      <Typography variant="subtitle1" align="center" color="text.secondary" sx={{ mb: 4 }}>
        Admin Dashboard
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box display="flex" flexDirection="column" gap={3}>
        {/* Status Cards */}
        <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2}>
          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Analytics color="primary" />
                <Typography variant="h6">Agent Status</Typography>
              </Box>
              <Chip
                label={agentStatus?.agentRunning ? 'Running' : 'Stopped'}
                color={agentStatus?.agentRunning ? 'success' : 'default'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <WhatsApp color="success" />
                <Typography variant="h6">WhatsApp</Typography>
              </Box>
              <Chip
                label={agentStatus?.whatsappConnected ? 'Connected' : 'Disconnected'}
                color={agentStatus?.whatsappConnected ? 'success' : 'error'}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>

          <Card sx={{ flex: 1 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1}>
                <Email color="info" />
                <Typography variant="h6">Email Service</Typography>
              </Box>
              <Chip
                label="Ready"
                color="success"
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Box>

        {/* Stats */}
        {agentStatus?.stats && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Session Stats
              </Typography>
              <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} gap={2}>
                <Box flex={1} textAlign="center">
                  <Typography variant="h4" color="primary">
                    {agentStatus.stats.totalProcessed || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Processed
                  </Typography>
                </Box>
                <Box flex={1} textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {agentStatus.stats.leadsGenerated || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Leads Generated
                  </Typography>
                </Box>
                <Box flex={1} textAlign="center">
                  <Typography variant="h4" color="info.main">
                    {agentStatus.stats.emailsSent || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Emails Sent
                  </Typography>
                </Box>
                <Box flex={1} textAlign="center">
                  <Typography variant="h4" color="success.main">
                    {agentStatus.stats.whatsappMessagesSent || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    WhatsApp Messages
                  </Typography>
                </Box>
              </Box>
              {agentStatus.agentRunning && progress > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Progress: {Math.round(progress)}%
                  </Typography>
                  <LinearProgress variant="determinate" value={progress} sx={{ mt: 1 }} />
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Control Panel */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Lead Generation Control
            </Typography>
            
            <Box display="flex" flexDirection={{ xs: 'column', md: 'row' }} gap={2} sx={{ mb: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Business Type</InputLabel>
                <Select
                  value={businessType}
                  label="Business Type"
                  onChange={(e) => setBusinessType(e.target.value)}
                  disabled={agentStatus?.agentRunning}
                >
                  {config?.businessTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={location}
                  label="Location"
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={agentStatus?.agentRunning}
                >
                  {config?.locations.map((loc) => (
                    <MenuItem key={loc} value={loc}>
                      {loc}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                type="number"
                label="Max Results"
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                disabled={agentStatus?.agentRunning}
                inputProps={{ min: 1, max: 200 }}
              />
            </Box>

            <Box display="flex" gap={2} flexWrap="wrap">
              {!agentStatus?.agentRunning ? (
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <PlayArrow />}
                  onClick={startAgent}
                  disabled={loading || !businessType || !location}
                  color="success"
                >
                  Start Agent
                </Button>
              ) : (
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <Stop />}
                  onClick={stopAgent}
                  disabled={loading}
                  color="error"
                >
                  Stop Agent
                </Button>
              )}

              <Button
                variant="outlined"
                startIcon={<WhatsApp />}
                onClick={connectWhatsApp}
                disabled={loading || agentStatus?.whatsappConnected}
              >
                {agentStatus?.whatsappConnected ? 'WhatsApp Connected' : 'Connect WhatsApp'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default App;
