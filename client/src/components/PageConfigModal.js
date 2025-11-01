import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Box,
  Typography,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd' ;
import { Close as CloseIcon, DragIndicator as DragHandle } from '@mui/icons-material';

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'email', label: 'Email' },
  { value: 'tel', label: 'Phone' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'textarea', label: 'Text Area' },
];

const PageConfigModal = ({ open, onClose, page, onSave }) => {
  const [fields, setFields] = useState(page?.fields || []);
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    visible: true,
    options: []
  });
  const [showNewFieldForm, setShowNewFieldForm] = useState(false);

  const handleAddField = () => {
    if (!newField.name || !newField.label) return;
    
    setFields([...fields, { ...newField, id: `field-${Date.now()}` }]);
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      visible: true,
      options: []
    });
    setShowNewFieldForm(false);
  };

  const handleRemoveField = (fieldId) => {
    setFields(fields.filter(field => field.id !== fieldId));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setFields(items);
  };

  const handleSave = () => {
    onSave({
      ...page,
      fields: fields.map((field, index) => ({
        ...field,
        order: index
      }))
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <span>Configure {page?.name}</span>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Fields</Typography>
            
            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="fields">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef}>
                      {fields.map((field, index) => (
                        <Draggable key={field.id} draggableId={field.id} index={index}>
                          {(provided) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              elevation={1}
                              sx={{
                                p: 2,
                                mb: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 2
                              }}
                            >
                              <div {...provided.dragHandleProps}>
                                <DragHandle />
                              </div>
                              <div style={{ flex: 1 }}>
                                <Typography variant="subtitle2">{field.label}</Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {field.name} • {field.type}
                                </Typography>
                              </div>
                              <IconButton 
                                size="small" 
                                onClick={() => handleRemoveField(field.id)}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              {!showNewFieldForm ? (
                <Button 
                  fullWidth 
                  variant="outlined" 
                  onClick={() => setShowNewFieldForm(true)}
                  sx={{ mt: 1 }}
                >
                  + Add Field
                </Button>
              ) : (
                <Paper variant="outlined" sx={{ p: 2, mt: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>New Field</Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Field Name"
                        value={newField.name}
                        onChange={(e) => setNewField({...newField, name: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Display Label"
                        value={newField.label}
                        onChange={(e) => setNewField({...newField, label: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth size="small">
                        <InputLabel>Field Type</InputLabel>
                        <Select
                          value={newField.type}
                          label="Field Type"
                          onChange={(e) => setNewField({...newField, type: e.target.value})}
                        >
                          {fieldTypes.map((type) => (
                            <MenuItem key={type.value} value={type.value}>
                              {type.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={newField.required}
                            onChange={(e) => setNewField({...newField, required: e.target.checked})}
                          />
                        }
                        label="Required"
                      />
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={newField.visible}
                            onChange={(e) => setNewField({...newField, visible: e.target.checked})}
                          />
                        }
                        label="Visible"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        <Button
                          size="small"
                          onClick={() => setShowNewFieldForm(false)}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={handleAddField}
                          disabled={!newField.name || !newField.label}
                        >
                          Add Field
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              )}
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>Page Actions</Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Allow Export"
                sx={{ display: 'block', mb: 1 }}
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Allow Create"
                sx={{ display: 'block', mb: 1 }}
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Allow Edit"
                sx={{ display: 'block', mb: 1 }}
              />
              <FormControlLabel
                control={<Checkbox defaultChecked />}
                label="Allow Delete"
                sx={{ display: 'block', mb: 1 }}
              />
            </Paper>
            
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Preview</Typography>
            <Paper variant="outlined" sx={{ p: 2, minHeight: '200px' }}>
              {fields.length === 0 ? (
                <Box 
                  display="flex" 
                  justifyContent="center" 
                  alignItems="center" 
                  height="150px"
                  color="text.secondary"
                >
                  No fields added yet
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {fields.map((field) => (
                    <Grid item xs={12} key={field.id}>
                      <TextField
                        fullWidth
                        label={field.label || 'Field'}
                        variant="outlined"
                        size="small"
                        disabled={!field.visible}
                        required={field.required}
                        type={field.type === 'number' ? 'number' : field.type}
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
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PageConfigModal;
