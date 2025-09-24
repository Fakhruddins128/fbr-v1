import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  AdminPanelSettings as AdminIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCompanies } from '../store/slices/companySlice';
import { userApi, User, CreateUserRequest, UpdateUserRequest } from '../api/userApi';
import { UserRole } from '../types';

const UserManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user: currentUser } = useAppSelector(state => state.auth);
  const { companies, isLoading: companiesLoading } = useAppSelector(state => state.company);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditUser, setCurrentEditUser] = useState<User | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  
  // Form state
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    firstName: '',
    lastName: '',
    role: '',
    companyId: '',
  });
  
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  // User stats
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    companyUsers: 0,
  });

  useEffect(() => {
    fetchUsers();
    if (currentUser?.role === UserRole.SUPER_ADMIN) {
      dispatch(fetchCompanies());
    }
  }, [dispatch, currentUser]);

  useEffect(() => {
    calculateUserStats();
  }, [users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await userApi.getAllUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setSnackbar({ open: true, message: 'Failed to fetch users', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const calculateUserStats = () => {
    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(user => user.isActive).length,
      adminUsers: users.filter(user => ['SUPER_ADMIN', 'COMPANY_ADMIN', 'ADMIN'].includes(user.role)).length,
      companyUsers: users.filter(user => user.companyId).length,
    };
    setUserStats(stats);
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setIsEditing(true);
      setCurrentEditUser(user);
      setFormData({
        username: user.username,
        password: '',
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId || '',
      });
    } else {
      setIsEditing(false);
      setCurrentEditUser(null);
      setFormData({
        username: '',
        password: '',
        email: '',
        firstName: '',
        lastName: '',
        role: '',
        companyId: currentUser?.role === UserRole.COMPANY_ADMIN ? currentUser.companyId || '' : '',
      });
    }
    setOpenDialog(true);
    setFormErrors({});
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };

  const handleOpenPasswordDialog = (user: User) => {
    setCurrentEditUser(user);
    setPasswordData({ newPassword: '', confirmPassword: '' });
    setOpenPasswordDialog(true);
    setFormErrors({});
  };

  const handleClosePasswordDialog = () => {
    setOpenPasswordDialog(false);
    setPasswordErrors({});
    setPasswordData({ newPassword: '', confirmPassword: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (passwordErrors[name]) {
      setPasswordErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field if it exists
    if (formErrors[name]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.username.trim()) errors.username = 'Username is required';
    if (!isEditing && !formData.password.trim()) errors.password = 'Password is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.role) errors.role = 'Role is required';
    
    // Company ID validation
    if (formData.role !== 'SUPER_ADMIN' && !formData.companyId) {
      errors.companyId = 'Company is required for non-super admin users';
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};
    
    if (!passwordData.newPassword.trim()) {
      errors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters long';
    }
    
    if (!passwordData.confirmPassword.trim()) {
      errors.confirmPassword = 'Confirm password is required';
    } else if (passwordData.newPassword && passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      if (isEditing && currentEditUser) {
        const updateData: UpdateUserRequest = {
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          companyId: formData.role === 'SUPER_ADMIN' ? undefined : formData.companyId,
        };
        await userApi.updateUser(currentEditUser.id, updateData);
        setSnackbar({ open: true, message: 'User updated successfully', severity: 'success' });
      } else {
        const createData: CreateUserRequest = {
          username: formData.username,
          password: formData.password,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
          companyId: formData.role === 'SUPER_ADMIN' ? undefined : formData.companyId,
        };
        await userApi.createUser(createData);
        setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
      }
      
      handleCloseDialog();
      fetchUsers();
    } catch (error: any) {
      console.error('Error saving user:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to save user', severity: 'error' });
    }
  };

  const handlePasswordSubmit = async () => {
    if (!validatePasswordForm() || !currentEditUser) return;
    
    try {
      await userApi.updateUserPassword(currentEditUser.id, passwordData.newPassword);
      setSnackbar({ open: true, message: 'Password updated successfully', severity: 'success' });
      handleClosePasswordDialog();
    } catch (error: any) {
      console.error('Error updating password:', error);
      setSnackbar({ open: true, message: error.message || 'Failed to update password', severity: 'error' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await userApi.deleteUser(userId);
        setSnackbar({ open: true, message: 'User deleted successfully', severity: 'success' });
        fetchUsers();
      } catch (error: any) {
        console.error('Error deleting user:', error);
        setSnackbar({ open: true, message: error.message || 'Failed to delete user', severity: 'error' });
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'error';
      case 'COMPANY_ADMIN': return 'warning';
      case 'ADMIN': return 'info';
      case 'ACCOUNTANT': return 'success';
      case 'SALES_PERSON': return 'default';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <AdminIcon />;
      case 'COMPANY_ADMIN': return <BusinessIcon />;
      case 'ADMIN': return <AdminIcon />;
      case 'ACCOUNTANT': return <PersonIcon />;
      case 'SALES_PERSON': return <PersonIcon />;
      default: return <PersonIcon />;
    }
  };

  const canCreateUser = currentUser?.role === UserRole.SUPER_ADMIN || currentUser?.role === UserRole.COMPANY_ADMIN;
  const canEditUser = (user: User) => {
    if (currentUser?.role === UserRole.SUPER_ADMIN) return true;
    if (currentUser?.role === UserRole.COMPANY_ADMIN) {
      return user.companyId === currentUser.companyId;
    }
    return false;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          User Management
        </Typography>
        {canCreateUser && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add User
          </Button>
        )}
      </Box>

      {/* User Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <GroupIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">{userStats.totalUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 2, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6">{userStats.activeUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AdminIcon sx={{ mr: 2, color: 'warning.main' }} />
                <Box>
                  <Typography variant="h6">{userStats.adminUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Admin Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BusinessIcon sx={{ mr: 2, color: 'info.main' }} />
                <Box>
                  <Typography variant="h6">{userStats.companyUsers}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Company Users
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Users Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Company</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      {getRoleIcon(user.role)}
                      <Box sx={{ ml: 1 }}>
                        <Typography variant="body2" fontWeight="medium">
                          {user.firstName} {user.lastName}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role.replace('_', ' ')}
                      color={getRoleColor(user.role) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{user.companyName || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.isActive ? 'Active' : 'Inactive'}
                      color={user.isActive ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {canEditUser(user) && (
                        <>
                          <Tooltip title="Edit User">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(user)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Change Password">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenPasswordDialog(user)}
                            >
                              <LockIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete User">
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteUser(user.id)}
                              color="error"
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {isEditing ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="firstName"
                label="First Name"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!formErrors.firstName}
                helperText={formErrors.firstName}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="lastName"
                label="Last Name"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!formErrors.lastName}
                helperText={formErrors.lastName}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleInputChange}
                error={!!formErrors.username}
                helperText={formErrors.username}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                error={!!formErrors.email}
                helperText={formErrors.email}
                fullWidth
                required
              />
            </Grid>
            {!isEditing && (
              <Grid size={{ xs: 12 }}>
                <TextField
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  fullWidth
                  required
                />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth required error={!!formErrors.role}>
                <InputLabel>Role</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                >
                  {currentUser?.role === UserRole.SUPER_ADMIN && (
                    <MenuItem value="SUPER_ADMIN">Super Admin</MenuItem>
                  )}
                  <MenuItem value="COMPANY_ADMIN">Company Admin</MenuItem>
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="ACCOUNTANT">Accountant</MenuItem>
                  <MenuItem value="SALES_PERSON">Sales Person</MenuItem>
                </Select>
                {formErrors.role && (
                  <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                    {formErrors.role}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            {formData.role !== 'SUPER_ADMIN' && (
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required error={!!formErrors.companyId}>
                  <InputLabel>Company</InputLabel>
                  <Select
                    name="companyId"
                    value={formData.companyId}
                    label="Company"
                    onChange={(e) => setFormData(prev => ({ ...prev, companyId: e.target.value }))}
                    disabled={companiesLoading}
                  >
                    {(currentUser?.role === UserRole.COMPANY_ADMIN 
                      ? companies.filter(company => company.id === currentUser.companyId)
                      : companies
                    ).map((company) => (
                      <MenuItem key={company.id} value={company.id}>
                        {company.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {formErrors.companyId && (
                    <Typography variant="caption" color="error" sx={{ ml: 2 }}>
                      {formErrors.companyId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={openPasswordDialog} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Change Password for {currentEditUser?.firstName} {currentEditUser?.lastName}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="newPassword"
                label="New Password"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordInputChange}
                error={!!passwordErrors.newPassword}
                helperText={passwordErrors.newPassword}
                fullWidth
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                name="confirmPassword"
                label="Confirm Password"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordInputChange}
                error={!!passwordErrors.confirmPassword}
                helperText={passwordErrors.confirmPassword}
                fullWidth
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>Cancel</Button>
          <Button onClick={handlePasswordSubmit} variant="contained">
            Update Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default UserManagement;