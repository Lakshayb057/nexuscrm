import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  Paper, 
  Grid, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  FormGroup,
  FormHelperText
} from '@mui/material';
import { 
  Settings as SettingsIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  DragIndicator as DragIndicatorIcon
} from '@mui/icons-material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import api from '../../services/api';

const PageConfig = () => {
  const [pages, setPages] = useState([]);
  const [selectedPage, setSelectedPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openFieldDialog, setOpenFieldDialog] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [fieldForm, setFieldForm] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    visible: true,
    options: [],
    placeholder: '',
    width: '100%',
    order: 0
  });

  // Fetch available pages
  useEffect(() => {
    const fetchPages = async () => {
      try {
        const response = await api.get('/settings/pages/available-pages');
        setPages(response.data.data);
        if (response.data.data.length > 0 && !selectedPage) {
          setSelectedPage(response.data.data[0]);
        }
      } catch (error) {
        console.error('Error fetching pages:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPages();
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setSelectedPage(pages[newValue]);
  };

  // Handle field form input change
  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle form submission for adding/editing a field
  const handleFieldSubmit = async (e) => {
    e.preventDefault();
    // TODO: Implement API call to save field configuration
    console.log('Field submitted:', fieldForm);
    setOpenFieldDialog(false);
  };

  // Handle drag end for field reordering
  const onDragEnd = (result) => {
    if (!result.destination) return;
    
    const newFields = Array.from(selectedPage.fields);
    const [reorderedItem] = newFields.splice(result.source.index, 1);
    newFields.splice(result.destination.index, 0, reorderedItem);
    
    // Update order property based on new position
    const updatedFields = newFields.map((field, index) => ({
      ...field,
      order: index
    }));
    
    setSelectedPage(prev => ({
      ...prev,
      fields: updatedFields
    }));
    
    // TODO: Save the new order to the server
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Page Configuration
      </Typography>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedPage ? pages.findIndex(p => p.name === selectedPage.name) : 0}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
        >
          {pages.map((page) => (
            <Tab 
              key={page.name} 
              label={page.label} 
              icon={<SettingsIcon />} 
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Paper>

      {selectedPage && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">Page Actions</Typography>
                <Button 
                  variant="contained" 
                  color="primary" 
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={() => {
                    setEditingField(null);
                    setFieldForm({
                      name: '',
                      label: '',
                      type: 'text',
                      required: false,
                      visible: true,
                      options: [],
                      placeholder: '',
                      width: '100%',
                      order: selectedPage.fields?.length || 0
                    });
                    setOpenFieldDialog(true);
                  }}
                >
                  Add Field
                </Button>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Box>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedPage.actions?.export ?? true}
                        onChange={(e) => {
                          // TODO: Update actions
                        }}
                        name="export"
                      />
                    }
                    label="Enable Export"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={selectedPage.actions?.import ?? true}
                        onChange={(e) => {
                          // TODO: Update actions
                        }}
                        name="import"
                      />
                    }
                    label="Enable Import"
                  />
                  {/* Add more action toggles as needed */}
                </FormGroup>
              </Box>
            </Paper>
            
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Available Fields
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <List {...provided.droppableProps} ref={provided.innerRef}>
                      {selectedPage.fields?.map((field, index) => (
                        <Draggable key={field.name} draggableId={field.name} index={index}>
                          {(provided) => (
                            <ListItem
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              secondaryAction={
                                <Box>
                                  <IconButton 
                                    edge="end" 
                                    onClick={() => {
                                      setEditingField(field);
                                      setFieldForm({
                                        ...field,
                                        options: field.options || []
                                      });
                                      setOpenFieldDialog(true);
                                    }}
                                  >
                                    <EditIcon />
                                  </IconButton>
                                  <IconButton 
                                    edge="end" 
                                    onClick={() => {
                                      // TODO: Handle delete field
                                    }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Box>
                              }
                            >
                              <div {...provided.dragHandleProps}>
                                <DragIndicatorIcon />
                              </div>
                              <ListItemIcon>
                                {field.visible ? <VisibilityIcon /> : <VisibilityOffIcon />}
                              </ListItemIcon>
                              <ListItemText 
                                primary={field.label} 
                                secondary={field.type}
                              />
                            </ListItem>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </List>
                  )}
                </Droppable>
              </DragDropContext>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, minHeight: '70vh' }}>
              <Typography variant="h5" gutterBottom>
                {selectedPage.label} Preview
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              {/* Preview of the form based on the configuration */}
              <Grid container spacing={2}>
                {selectedPage.fields
                  ?.sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((field) => (
                    <Grid item xs={12} sm={field.width === '100%' ? 12 : 6} key={field.name}>
                      <TextField
                        fullWidth
                        label={field.label}
                        variant="outlined"
                        disabled={!field.visible}
                        required={field.required}
                        placeholder={field.placeholder}
                        type={field.type === 'number' ? 'number' : 'text'}
                        select={field.type === 'select'}
                      >
                        {field.type === 'select' &&
                          field.options?.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                      </TextField>
                    </Grid>
                  ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Field Configuration Dialog */}
      <Dialog 
        open={openFieldDialog} 
        onClose={() => setOpenFieldDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingField ? 'Edit Field' : 'Add New Field'}
        </DialogTitle>
        <form onSubmit={handleFieldSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Field Name"
                  name="name"
                  value={fieldForm.name}
                  onChange={handleFieldChange}
                  required
                  margin="normal"
                  helperText="Must be unique and use camelCase"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Display Label"
                  name="label"
                  value={fieldForm.label}
                  onChange={handleFieldChange}
                  required
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Field Type</InputLabel>
                  <Select
                    name="type"
                    value={fieldForm.type}
                    onChange={handleFieldChange}
                    label="Field Type"
                  >
                    <MenuItem value="text">Text</MenuItem>
                    <MenuItem value="number">Number</MenuItem>
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="select">Dropdown</MenuItem>
                    <MenuItem value="checkbox">Checkbox</MenuItem>
                    <MenuItem value="textarea">Text Area</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="phone">Phone</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Width"
                  name="width"
                  value={fieldForm.width}
                  onChange={handleFieldChange}
                  margin="normal"
                  select
                >
                  <MenuItem value="100%">Full Width</MenuItem>
                  <MenuItem value="50%">Half Width</MenuItem>
                  <MenuItem value="33.33%">One Third</MenuItem>
                  <MenuItem value="66.66%">Two Thirds</MenuItem>
                  <MenuItem value="25%">One Fourth</MenuItem>
                  <MenuItem value="75%">Three Fourths</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <FormGroup row>
                  <FormControlLabel
                    control={
                      <Checkbox 
                        name="required"
                        checked={fieldForm.required}
                        onChange={handleFieldChange}
                      />
                    }
                    label="Required"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        name="visible"
                        checked={fieldForm.visible}
                        onChange={handleFieldChange}
                      />
                    }
                    label="Visible"
                  />
                </FormGroup>
              </Grid>
              {fieldForm.type === 'select' && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Options
                  </Typography>
                  {fieldForm.options?.map((option, index) => (
                    <Box key={index} display="flex" alignItems="center" mb={1}>
                      <TextField
                        label="Label"
                        value={option.label || ''}
                        onChange={(e) => {
                          const newOptions = [...fieldForm.options];
                          newOptions[index].label = e.target.value;
                          setFieldForm(prev => ({
                            ...prev,
                            options: newOptions
                          }));
                        }}
                        margin="dense"
                        size="small"
                        sx={{ mr: 1, flex: 1 }}
                      />
                      <TextField
                        label="Value"
                        value={option.value || ''}
                        onChange={(e) => {
                          const newOptions = [...fieldForm.options];
                          newOptions[index].value = e.target.value;
                          setFieldForm(prev => ({
                            ...prev,
                            options: newOptions
                          }));
                        }}
                        margin="dense"
                        size="small"
                        sx={{ mr: 1, flex: 1 }}
                      />
                      <IconButton
                        onClick={() => {
                          const newOptions = [...fieldForm.options];
                          newOptions.splice(index, 1);
                          setFieldForm(prev => ({
                            ...prev,
                            options: newOptions
                          }));
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setFieldForm(prev => ({
                        ...prev,
                        options: [...(prev.options || []), { label: '', value: '' }]
                      }));
                    }}
                    size="small"
                  >
                    Add Option
                  </Button>
                </Grid>
              )}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Placeholder"
                  name="placeholder"
                  value={fieldForm.placeholder}
                  onChange={handleFieldChange}
                  margin="normal"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenFieldDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingField ? 'Update' : 'Add'} Field
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PageConfig;
