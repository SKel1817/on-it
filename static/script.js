// Path to your JSON file
const jsonPath = "../static/auditsteps.json";

// Variables to store user responses
let currentStepIndex = 0;

// Fetch and process the JSON file
fetch(jsonPath)
  .then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    return response.json();
  })
  .then((data) => {
    const steps = data.CybersecurityAudit;
    const stepKeys = Object.keys(steps);

    // Map of radio button selections to steps
    const stepMapping = {
      "servers": "Step1a",       // servers
      "applications": "Step1b",  // applications
      "workstations": "Step1c",  // workstations
      "cloudServices": "Step1d", // cloudServices
      "devices": "Step1e",       // devices
      "networkArchitecture": "Step1f"  // network architecture
    };

    // Function to display a step
    function displayStep(stepIndex) {
      const step = steps[stepKeys[stepIndex]];

      // Update HTML with the step data
      document.getElementById("stepName").textContent = stepKeys[stepIndex];
      document.getElementById("instruction").textContent = step.Instruction;
      document.getElementById("explanation").textContent = step.Explanation;

      // Example content formatting
      const exampleDiv = document.getElementById("example");
      exampleDiv.innerHTML = "<strong>Example:</strong><br>";
      for (const [key, value] of Object.entries(step.Example)) {
        exampleDiv.innerHTML += `${key}: ${value}<br>`;
      }

      // Clear the input field
      document.getElementById("auditInput").value = "";

      // Show the radio buttons only on step 1 (index 0)
      const radioButtons = document.querySelectorAll('label, input[type="radio"]');
      if (stepIndex === 0) {
        radioButtons.forEach((elem) => {
          elem.style.display = 'block'; // Show radio buttons
        });

        // Hide the input textbox during step 1
        document.getElementById("auditInput").style.display = 'none';
      } else {
        radioButtons.forEach((elem) => {
          elem.style.display = 'none'; // Hide radio buttons
        });

        // Show the input textbox for other steps
        document.getElementById("auditInput").style.display = 'block';
      }
    }

    // Initial step display
    displayStep(currentStepIndex);

    document.getElementById("nextButton").addEventListener("click", () => {
      // Get the selected radio button for each section
      const selectedRadio = document.querySelector('input[type="radio"]:checked'); // Check which radio is selected
    
      if (selectedRadio) {
        const selectedStep = stepMapping[selectedRadio.name]; // Get the corresponding step based on the radio button NAME
        const stepIndex = stepKeys.indexOf(selectedStep); // Find the index of the associated step
    
        // Move to the next associated step or finish
        if (stepIndex !== -1) {
          displayStep(stepIndex);
          currentStepIndex = stepIndex;
        } else {
          alert("No valid step found for the selected radio button.");
        }
      } else {
        alert("Please select a valid option before proceeding.");
      }
    });
    
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });

document.addEventListener('DOMContentLoaded', () => {
  const dropdown = document.getElementById('frameworkDropdown');
  const detailsDiv = document.getElementById('frameworkDetails');

  // Fetch the JSON data
  fetch('/static/auditframeworks.json')
    .then(response => response.json())
    .then(data => {
      const frameworks = data.frameworks;

      // Populate the dropdown menu
      frameworks.forEach((framework, index) => {
        const option = document.createElement('option');
        option.value = index; // Use index as the value
        option.textContent = framework.name;
        dropdown.appendChild(option);
      });

      // Add event listener for dropdown change
      dropdown.addEventListener('change', (event) => {
        const selectedIndex = event.target.value;
        if (selectedIndex) {
          const selectedFramework = frameworks[selectedIndex];
          displayFrameworkDetails(selectedFramework);
        } else {
          detailsDiv.innerHTML = ''; // Clear details if no selection
        }
      });
    })
    .catch(error => console.error('Error fetching JSON:', error));

  // Function to display framework details
  function displayFrameworkDetails(framework) {
    detailsDiv.innerHTML = ` 
      <h2>${framework.name}</h2>
      <p><strong>Definition:</strong> ${framework.definition}</p>
      <p><strong>How to Use:</strong></p>
      <ul>${framework.how_to_use.map(step => `<li>${step}</li>`).join('')}</ul>
      <p><strong>Advantages:</strong></p>
      <ul>${framework.advantages.map(adv => `<li>${adv}</li>`).join('')}</ul>
      <p><strong>Disadvantages:</strong></p>
      <ul>${framework.disadvantages.map(disadv => `<li>${disadv}</li>`).join('')}</ul>
      <p><strong>More Info:</strong> <a href="${framework.link}" target="_blank">Learn more</a></p>
    `;
  }
});
