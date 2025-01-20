// Path to your JSON file
const jsonPath = "../static/auditsteps.json";

// Variables to store user responses
let currentStepIndex = 0;
let selectedSteps = []; // Array to store the sequence of steps for "Yes" selections

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
      servers: "Step1a",       // servers
      applications: "Step1b",  // applications
      workstations: "Step1c",  // workstations
      cloudServices: "Step1d", // cloudServices
      devices: "Step1e",       // devices
      networkArchitecture: "Step1f",  // network architecture
    };

    // Function to display a step
    function displayStep(stepKey) {
      const step = steps[stepKey];

      // Update HTML with the step data
      document.getElementById("stepName").textContent = stepKey;
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

      // Show the radio buttons only on the first step (index 0)
      const radioButtons = document.querySelectorAll('label, input[type="radio"]');
      if (stepKey === "Step1") {
        radioButtons.forEach((elem) => {
          elem.style.display = "block"; // Show radio buttons
        });

        // Hide the input textbox during step 1
        document.getElementById("auditInput").style.display = "none";
      } else {
        radioButtons.forEach((elem) => {
          elem.style.display = "none"; // Hide radio buttons
        });

        // Show the input textbox for other steps
        document.getElementById("auditInput").style.display = "block";
      }
    }

    // Initial step display
    displayStep(stepKeys[currentStepIndex]);

    document.getElementById("nextButton").addEventListener("click", () => {
      if (currentStepIndex === 0) {
        // On the first step, capture the user's selections
        const selectedRadios = document.querySelectorAll('input[type="radio"]:checked');
        selectedSteps = []; // Reset selected steps

        selectedRadios.forEach((radio) => {
          const selectedName = radio.name; // e.g., "servers"
          const selectedValue = radio.value; // e.g., "Yes" or "No"

          if (selectedValue === "Yes" && stepMapping[selectedName]) {
            selectedSteps.push(stepMapping[selectedName]); // Add the corresponding step to the selected steps
          }
        });

        if (selectedSteps.length > 0) {
          currentStepIndex = 0; // Reset to the first step in the selected steps
          displayStep(selectedSteps[currentStepIndex]);
        } else {
          alert("Please select at least one option with 'Yes' to proceed.");
        }
      } else {
        // Handle subsequent steps
        const userInput = document.getElementById("auditInput").value.trim();

        if (userInput) {
          // Logic for handling user input on other steps
          console.log(`User response for ${selectedSteps[currentStepIndex]}: ${userInput}`);

          // Move to the next step in the selected sequence
          if (currentStepIndex < selectedSteps.length - 1) {
            currentStepIndex++;
            displayStep(selectedSteps[currentStepIndex]);
          } else {
            alert("You have completed all the selected steps.");
          }
        } else {
          alert("Please enter a response before proceeding.");
        }
      }
    });
  })
  .catch((error) => {
    console.error("There was a problem with the fetch operation:", error);
  });
