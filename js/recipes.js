import {insertHeader, addIngredientToList, createRecipeCard, createClosedRecipeCard, makeContentEditable, addToArray} from './functions.js';
import { isHrefLink, createDomElement, generateRandomID } from './utilities.js';
import { Recipe } from './recipeClass.js';

// Variables

const steps = document.querySelectorAll('.form_step');
const next_buttons = document.querySelectorAll('.next_button');
const inputs = document.querySelectorAll('input[class*=add_recipe_inputs]');
const filter_Inputs = document.querySelectorAll('input[type="checkbox"]');
const header_placeholder = window.header_placeholder;
const add_recipe_button = window.add_recipe;
const cancel_adding_recipe_button = window.cancel_adding;
const view_recipes_button = window.view_recipes;
const form_for_filtering_recipes = window.filtering_displayed_recipes;
const list_of_ingredients = window.list_of_ingredients;
const list_of_instructions = window.list_of_instructions;
const add_ingredient_button = window.add_ingredient;
const add_instruction_button = window.add_instruction;
const [recipeName, recipeIngredient, recipeInstructions, recipeImage] = inputs;
const searchInputField = window.search_recipes_input;
const searchFilterButton = window.search_recipes;

let stepOne;
let stepTwo;
let stepThree;
let stepFour;
let stepFive;
let stepSix;
let stepSeven;
let currentFormStep = 1;
let timeouts = [];

// Functions

async function nextFormStep(e) {
	if(currentFormStep < next_buttons.length) {
		let formInputParentElement = e.target.parentElement;

		if(formInputParentElement.id == "step-1") {
			if(!recipeName.value) {
				alert("You need to add a name");
			}
			else {
				stepOne = recipeName.value;
				document.getElementById('step-' + currentFormStep).classList.remove('active');
				currentFormStep++;
				document.getElementById('step-' + currentFormStep).classList.add('active');
				recipeName.value = "";
			};
		}
		else if(formInputParentElement.id == "step-2") {
			if(formInputParentElement.children[2].children.length < 1) {
				alert("You need to add at least one ingredient");
			}
			else {
				const flavors = document.querySelectorAll('input[type="radio"][name="flavor"]');
				const consistency = document.querySelectorAll('input[type="radio"][name="consistency"]');

				stepTwo = [];
				for(let i = 0; i < list_of_ingredients.children.length; i++) {
					stepTwo.push(list_of_ingredients.children[i].innerText);
				};

				for(let i = 0; i < flavors.length; i++) {
					if(flavors[i].checked) {
						stepThree = flavors[i].value;
						break;
					};
				};

				for(let i = 0; i < consistency.length; i++) {
					if(consistency[i].checked) {
						stepFour = consistency[i].value;
						break;
					};
				};
				
				document.getElementById('step-' + currentFormStep).classList.remove('active');
				currentFormStep++;
				document.getElementById('step-' + currentFormStep).classList.add('active');
				recipeIngredient.value = "";
				for (let i = list_of_ingredients.children.length - 1; i >= 0; i--) {
					list_of_ingredients.removeChild(list_of_ingredients.children[i]);
				};
			};
		}
		else if(formInputParentElement.id == "step-3") {
			if(formInputParentElement.children[2].children.length < 1) {
				alert("You need to add at least one instruction");
			}
			else {
				const inputs = document.querySelectorAll('input[type="radio"][name="difficulty"]');
				stepFive = [];
				for(let i = 0; i < list_of_instructions.children.length; i++) {
					stepFive.push(list_of_instructions.children[i].innerText);
				};
				stepSix = '';
				for(let i = 0; i < inputs.length; i++) {
					if(inputs[i].checked) {
						stepSix = inputs[i].value;
						break;
					};
				};
				document.getElementById('step-' + currentFormStep).classList.remove('active');
				currentFormStep++;
				document.getElementById('step-' + currentFormStep).classList.add('active');
				recipeInstructions.value = "";
				for (let i = list_of_instructions.children.length - 1; i >= 0; i--) {
					list_of_instructions.removeChild(list_of_instructions.children[i]);
				};
				inputs[0].checked = true;
			};
		};
	}
	else {
		if(!recipeImage.value) {
			stepSeven = null;
		}
		else {
			stepSeven = recipeImage.value;
		};
		recipeImage.value = "";
		const message = createDomElement('p', 'finished_message', 'all_done_message', 'All done!');
		const parent = document.getElementById('step-4');
		parent.appendChild(message);
		const idNumber = generateRandomID();
		const recipe = new Recipe(stepOne, stepTwo, stepThree, stepFour, stepFive, stepSix, stepSeven, idNumber);

		fetch('http://127.0.0.1:3000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recipe) // Send the recipe data as JSON
    })
    .then(response => response.json())
    .then(data => {
      console.log('Recipe uploaded:', data);
    })
    .catch(error => {
      console.error('Error uploading recipe:', error);
    });
				
		const timeout = setTimeout(() => {
			parent.removeChild(message);
			steps.forEach(e => e.classList.remove('active'));
			cancel_adding_recipe_button.classList.add('hidden');
		}, 2000);
		timeouts.push(timeout);
	};
};

async function deleteRecipe() {
  const confirmation = confirm('Are you sure you want to delete this recipe? The option is permanent.');
  if (confirmation) {
    const recipeId = this.parentElement.parentElement.parentElement.parentElement.parentElement.id;

    try {
      const response = await fetch(`http://127.0.0.1:3000/${recipeId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log(`Recipe with ID ${recipeId} has been deleted.`);
        // Remove the recipe from the DOM
        const recipeElement = document.getElementById(recipeId);
        recipeElement.remove();
      } 
			else {
        console.error(`Failed to delete recipe with ID ${recipeId}:`, await response.text());
      };
    } 
		catch (error) {
      console.error('Error deleting recipe:', error);
    };
  };
};

function updateRecipe() {
	const recipeParentCard = this.parentElement.parentElement;
	const cardId = recipeParentCard.id.split('child-card-').pop();
	const parentCardChildren = recipeParentCard.children;
	const saveChangesButton = document.getElementById(`save-changes-for-${cardId}`); // gotta make sure to target the correct button of the specific card
	const closedCardName = document.getElementById(`closed_card_name_${cardId}`);
	const closedCardImage = document.getElementById(`closed_card_image_${cardId}`);
	const closedCardDifficulty = document.getElementById(`${cardId}`).dataset.difficulty; // difficulty is the name of the attribute ("data-difficulty")
	const closedCardFlavor = document.getElementById(`${cardId}`).dataset.flavor;
	const closedCardConsistency = document.getElementById(`${cardId}`).dataset.consistency;
	
	let newName;
	let newImage;
	saveChangesButton.classList.remove('hidden');

	makeContentEditable(parentCardChildren, true, true);

	saveChangesButton.addEventListener('click', async function handler() {
		makeContentEditable(parentCardChildren, false, false);
		saveChangesButton.classList.add('hidden');

		// Checks if there's new values for the Card name and image
		for(let i = 0; i < parentCardChildren.length; i++) {
			if(parentCardChildren[i].tagName.toLowerCase() === 'h2') {
				newName = parentCardChildren[i].innerText;
			};

			if(parentCardChildren[i].tagName.toLowerCase() === 'input') {
				if(parentCardChildren[i].value) {
					const checkForValidImgUrl = isHrefLink(parentCardChildren[i].value);
					if(!checkForValidImgUrl) {
						newImage = '../assets/images/no-drink.png';
						parentCardChildren[i].value = '';
					}
					else {
						newImage = parentCardChildren[i].value;
						parentCardChildren[i].value = '';
					};
				};
			};
		};
		
		// Updates the different parts of the card on screen and in the database
		const image = document.getElementById(`image_${cardId}`);
		const name = document.getElementById(`recipe_name_${cardId}`).innerText;
		const currentIngredients = document.getElementById(`ingredient_list_${cardId}`);
		const currentInstructions = document.getElementById(`instructions_list_${cardId}`);
		const ingredients = [];
		const instructions = [];
		const difficulty = JSON.parse(closedCardDifficulty); // have to parse it so it doesn't add additional quatations
		const flavor = JSON.parse(closedCardFlavor);
		const consistency = JSON.parse(closedCardConsistency);

		
		if(newImage) {
			image.src = newImage;
			closedCardImage.src = newImage;
		}
		else {
			closedCardImage.src = image.src;
		};
		closedCardName.innerText = newName;
		addToArray(currentIngredients.children, ingredients);
		addToArray(currentInstructions.children, instructions);
		const recipe = new Recipe(name, ingredients, flavor, consistency, instructions, difficulty, image.src);
		const recipeID = recipeParentCard.parentElement.parentElement.parentElement.id;

		// Send the update request to the Node server
		try {
			const response = await fetch(`http://127.0.0.1:3000/${recipeID}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(recipe),
			});

			const result = await response.json();
			console.log("Update response:", result);
		} 
		catch (error) {
			console.error("Error updating recipe:", error);
		};
		
		saveChangesButton.removeEventListener('click', handler);
	});
};

// Events 

window.addEventListener('load', () => {
  insertHeader(header_placeholder);

  fetch('http://127.0.0.1:3000') // Fetch all recipes
    .then(response => response.json()) // Parse JSON response
    .then(data => {
      data.forEach(item => console.log(item))
			data.forEach(item => {
				const id = item.id;
				const name = item.name;
				const ingredient = item.ingredients;
				const instruction = item.instructions;
				const image = item.image;
				const difficulty = item.difficulty;
				const flavor = item.flavor;
				const consistency = item.consistency;
				const { recipeCard, dataset } = createRecipeCard(id, name, ingredient, instruction, image, deleteRecipe, updateRecipe)
				createClosedRecipeCard(
					id, 
					name, 
					image, 
					window.display,
					recipeCard,
					dataset,
					difficulty,
					flavor,
					consistency
					)
			});
    })
    .catch(error => {
      console.error('Error fetching data:', error);
    });
});

add_recipe_button.addEventListener('click', () => {
	if(cancel_adding_recipe_button) cancel_adding_recipe_button.classList.remove('hidden');
	timeouts.forEach(e => clearTimeout(e));
	steps.forEach(e => e.classList.remove('active'));
	list_of_ingredients.innerHTML = "";
	list_of_instructions.innerHTML = "";
	steps[0].classList.add('active');
	steps[0].children[1].value = '';
	currentFormStep = 1;
});

if(cancel_adding_recipe_button) {
	cancel_adding_recipe_button.addEventListener('click', function() {
		steps.forEach(e => e.classList.remove('active'));
		list_of_ingredients.innerHTML = "";
		list_of_instructions.innerHTML = "";
		currentFormStep = 1;
		this.classList.add('hidden');
	});
};

next_buttons.forEach(button => {
	if(button) button.addEventListener('click', nextFormStep);
});

if(add_ingredient_button) add_ingredient_button.addEventListener('click', () => {addIngredientToList(recipeIngredient, list_of_ingredients)});

if(add_instruction_button) add_instruction_button.addEventListener('click', () => {addIngredientToList(recipeInstructions, list_of_instructions)});

if(view_recipes_button) {
	view_recipes_button.addEventListener('click', () => {
		if(form_for_filtering_recipes.style.display == 'none') {
			form_for_filtering_recipes.style.display = 'flex';
		}
		else {
			form_for_filtering_recipes.style.display = 'none';
		};
	});
};

if(searchFilterButton) {searchFilterButton.addEventListener('click', () => {
	const search_query = searchInputField.value.toLowerCase();
	const searchWords = search_query.trim().split(/\s+/); // breaks the search input into an array of individual words
	const recipe_display = window.display;
	const checked_filters = [];
	const foundRecipes = [];

	for(let i = 0; i < filter_Inputs.length; i++) {
		if(filter_Inputs[i].checked) {
			checked_filters.push(filter_Inputs[i].name.toLowerCase());
		};
	};

	if(checked_filters.length > 0) {
		for(let i = 0; i < recipe_display.children.length; i++) {
			const recipe = recipe_display.children[i].children[1];
			const datasets = JSON.parse(recipe.parentElement.dataset.keywords);
			datasets.push(JSON.parse(recipe.parentElement.dataset.difficulty));
			datasets.push(JSON.parse(recipe.parentElement.dataset.flavor));
			datasets.push(JSON.parse(recipe.parentElement.dataset.consistency));
			const match = checked_filters.some(value => datasets.includes(value));

			let matches = 0;

			for(let i =0; i < checked_filters.length; i++) {
				if(datasets.includes(checked_filters[i])) {
					matches++
				};
			};

			// try to organize the recipes in the array based on number of matches they have
			
			if(match) {
				console.log(matches)
				if(search_query) {
					for(let i = 0; i < searchWords.length; i++) {
						if(recipe.innerText.toLowerCase().includes(searchWords[i])) {
							foundRecipes.push(recipe.parentElement);
							break; // the moment at least one word from the search input matches at least one word in the name of the element it returns true
						};
					};
				}
				else {
					foundRecipes.push(recipe.parentElement);
				};
			};
		};
	}
	else {
		for(let i = 0; i < recipe_display.children.length; i++) {
			const recipe = recipe_display.children[i].children[1];
			for(let i = 0; i < searchWords.length; i++) {
				if(recipe.innerText.toLowerCase().includes(searchWords[i])) {
					foundRecipes.push(recipe.parentElement);
					break;
				};
			};
		};
	};

	if(foundRecipes.length > 0) {
		for(let i = 0; i < recipe_display.children.length; i++) {
			recipe_display.children[i].style.display = 'none';	
		};
		foundRecipes.forEach(child => {
			child.style.display = 'flex';
		});
	}
	else {
		for(let i = 0; i < recipe_display.children.length; i++) {
			recipe_display.children[i].style.display = 'flex';	
		};
		alert("No recipe found");
	};
})};
