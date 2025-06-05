const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'DineFinder server is running' });
});

// Auth: Sign Up
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return res.status(400).json({ error: error.message });

  res.status(201).json({ message: 'Signup successful', user: data.user });
});

// Auth: Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });

  res.status(200).json({ message: 'Login successful', user: data.user, session: data.session });
});

// Get all restaurants
app.get('/api/restaurants', async (req, res) => {
  const { data, error } = await supabase.from('restaurants').select('*').order('name');
  if (error) return res.status(500).json({ error: 'Failed to fetch restaurants' });
  res.json(data);
});

// Get one restaurant
app.get('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('restaurants').select('*').eq('id', id).single();
  if (error || !data) return res.status(404).json({ error: 'Restaurant not found' });
  res.json(data);
});

// Search restaurants
app.get('/api/restaurants/search', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'Search query is required' });

  const { data, error } = await supabase
    .from('restaurants')
    .select('*')
    .or(`name.ilike.%${query}%,cuisine.ilike.%${query}%`);

  if (error) return res.status(500).json({ error: 'Search failed' });
  res.json(data);
});

// Add restaurant
app.post('/api/restaurants', async (req, res) => {
  const { name, cuisine, location, rating } = req.body;
  if (!name || !cuisine || !location)
    return res.status(400).json({ error: 'Name, cuisine, and location are required' });

  const { data, error } = await supabase
    .from('restaurants')
    .insert([{ name, cuisine, location, rating }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: 'Failed to add restaurant' });
  res.status(201).json(data);
});

// Delete restaurant
app.delete('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('restaurants').delete().eq('id', id);
  if (error) return res.status(500).json({ error: 'Failed to delete restaurant' });
  res.status(204).send();
});

// Update restaurant
app.put('/api/restaurants/:id', async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;
  const { data, error } = await supabase.from('restaurants').update(updateData).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: 'Failed to update restaurant' });
  res.json(data);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start
app.listen(port, () => {
  console.log(`✅ DineFinder API is running on http://localhost:${port}`);
});
