const http = require('http');
const fs = require('fs');

const hostname = '127.0.0.1';
const port = 3000;

// Function to save a recipe
const saveRecipeToFile = (recipeData) => {
  fs.readFile('recipes.json', 'utf8', (err, data) => {
    let recipes = [];
    if (!err) {
      try {
        recipes = JSON.parse(data);
      } catch (err) {
        console.error('Error parsing recipes file:', err);
      }
    };
    recipes.push(recipeData);
    fs.writeFile('recipes.json', JSON.stringify(recipes), 'utf8', (err) => {
      if (err) console.error('Error saving recipes:', err);
    });
  });
};

// Function to get recipes
const getRecipesFromFile = (callback) => {
  fs.readFile('recipes.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading recipes file:', err);
      callback([]);
    } 
    else {
      try {
        const recipes = JSON.parse(data);
        callback(recipes);
      } 
      catch (err) {
        console.error('Error parsing recipes file:', err);
        callback([]);
      };
    };
  });
};

// Function to delete a recipe
const deleteRecipeFromFile = (recipeId, callback) => {
  fs.readFile('recipes.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading recipes file:', err);
      callback(false);
      return;
    };

    try {
      let recipes = JSON.parse(data);
      const initialLength = recipes.length;
      recipes = recipes.filter((recipe) => recipe.id !== recipeId);

      if (recipes.length === initialLength) {
        callback(false);
        return;
      };

      fs.writeFile('recipes.json', JSON.stringify(recipes), 'utf8', (err) => {
        if (err) {
          console.error('Error saving updated recipes:', err);
          callback(false);
        } 
        else {
          callback(true);
        };
      });
    } 
    catch (err) {
      console.error('Error parsing recipes file:', err);
      callback(false);
    };
  });
};

// Function to update a recipe
const updateRecipeInFile = (recipeId, updatedRecipe, callback) => {
  fs.readFile('recipes.json', 'utf8', (err, data) => {
    if (err) {
      console.error('Error reading recipes file:', err);
      callback(false);
      return;
    };

    try {
      let recipes = JSON.parse(data);
      const index = recipes.findIndex((recipe) => recipe.id === recipeId);

      if (index === -1) {
        callback(false); // Recipe not found
        return;
      };

      // Update the recipe
      recipes[index] = { id: recipeId, ...updatedRecipe };

      // Save the updated recipes back to the file
      fs.writeFile('recipes.json', JSON.stringify(recipes), 'utf8', (err) => {
        if (err) {
          console.error('Error saving updated recipe:', err);
          callback(false);
        } 
        else {
          callback(true);
        };
      });
    } 
    catch (err) {
      console.error('Error parsing recipes file:', err);
      callback(false);
    };
  });
};

// Create the server
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Allow PUT
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.end();
    return;
  };

  if (req.method === 'GET' && req.url === '/') {
    getRecipesFromFile((recipes) => {
      res.end(JSON.stringify(recipes));
    });
  } 
  else if (req.method === 'POST' && req.url === '/') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const recipeData = JSON.parse(body);
        saveRecipeToFile(recipeData);
        res.end(JSON.stringify({ message: 'Recipe saved successfully!' }));
      } catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid data format' }));
      };
    });
  } 
  else if (req.method === 'DELETE' && req.url.startsWith('/')) {
    const recipeId = req.url.slice(1);
    deleteRecipeFromFile(recipeId, (success) => {
      if (success) {
        res.end(JSON.stringify({ message: 'Recipe deleted successfully!' }));
      } 
      else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Recipe not found' }));
      };
    });

  } 
  else if (req.method === 'PUT' && req.url.startsWith('/')) {
    const recipeId = req.url.slice(1);
    let body = '';

    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const updatedRecipe = JSON.parse(body);
        updateRecipeInFile(recipeId, updatedRecipe, (success) => {
          if (success) {
            res.end(JSON.stringify({ message: 'Recipe updated successfully!' }));
          } 
          else {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'Recipe not found' }));
          };
        });
      } 
      catch (err) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Invalid request format' }));
      };
    });
  } 
  else {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not Found' }));
  };
});

// Start the server
server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
