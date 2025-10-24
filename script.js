const themeToggle = document.querySelector(".theme-toggle");
const promptBtn = document.querySelector(".prompt-btn");
const promptInput = document.querySelector(".prompt-input");
const promptForm = document.querySelector(".prompt-form");
const modelSelect = document.getElementById("model-select");
const countSelect = document.getElementById("count-select");
const ratioSelect = document.getElementById("ratio-select");
const gridGallery = document.querySelector(".gallery-grid");
const generateBtn = document.querySelector(".generate-btn");
// removed sensitive token


//List of example prompts
const examplePrompts = [
    "A futuristic cityscape at sunset",
    "A serene mountain lake with reflections",
    "A bustling cyberpunk street filled with neon lights",
    "A tranquil forest glade with dappled sunlight",
    "A majestic castle perched on a cliff overlooking the sea"
];

//set theme based on saved preference or system preference
(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDarkTheme = savedTheme === "dark" || (!savedTheme && systemPrefersDark);
    document.body.classList.toggle("dark-theme", isDarkTheme);
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
})();

//Switch between dark and light mode
const toggleTheme = () => {
    const isDarkTheme = document.body.classList.toggle("dark-theme");
    localStorage.setItem("theme", isDarkTheme ? "dark" : "light");
    themeToggle.querySelector("i").className = isDarkTheme ? "fa-solid fa-sun" : "fa-solid fa-moon";
}

//Get image dimensions based on selected aspect ratio
const getImageDimensions = (aspectRatio, baseSize = 512) => {
    const [width, height] = aspectRatio.split("/").map(Number);
    const scaleFactor = baseSize / Math.sqrt(width * height);

    let calculatedWidth = Math.round(width * scaleFactor);
    let calculatedHeight = Math.round(height * scaleFactor);

    //Ensure dimensions are multiples of 16
    calculatedWidth = Math.round(calculatedWidth / 16) * 16;
    calculatedHeight = Math.round(calculatedHeight / 16) * 16;

    return { width: calculatedWidth, height: calculatedHeight };
};

//Update image card with generated image
const updateImageCard = (imgIndex, imgUrl) => {
    const imgCard = document.getElementById(`img-card-${imgIndex}`);
    if (!imgCard) return;
    imgCard.classList.remove("loading");
    imgCard.innerHTML = `<img src="${imgUrl}" class="result-img" />
                    <div class="img-overlay">
                        <a href="${imgUrl}" class="img-download-btn" download="${Date.now()}.png">
                          <i class="fa-solid fa-download"></i>  
                        </a>
                    </div>`;
}

const generateImages = async (selectedModel, imageCount, aspectRatio, promptText) => {
    const MODEL_URL = `https://api-inference.huggingface.co/models/${selectedModel}`;
    const { width, height } = getImageDimensions(aspectRatio);
    generateBtn.setAttribute("disabled", "true");

    //create an array of promises for image generation
    const imagePromises = Array.from({ length: imageCount }, async (_, i) => {
        //Make API request to generate image
         try {
            const response = await fetch(MODEL_URL,{
                headers: { Authorization: `Bearer ${API_KEY}`,
                    "content-type": "application/json",
            },
            method: "POST",
            body: JSON.stringify({
                inputs: promptText,
                parameters: {width, height},
                options: { wait_for_model: true, use_cache: false },
            }),
        });

        if (!response.ok) throw new Error((await response.json())?.error);

        //Convert response to blob and update image card
        const result = await response.blob();
        updateImageCard(i, URL.createObjectURL(result));
    }catch (error) {
        console.error(error);
        const imgCard = document.getElementById(`img-card-${i}`);
        imgCard.classList.replace("loading", "error");
        imgCard.querySelector(".status-text").textContent = "Error generating image";
    }
    })
    await Promise.allSettled(imagePromises);
    generateBtn.removeAttribute("disabled");
}

//Insert a random example prompt into the input field
promptBtn.addEventListener("click", () => {
    const prompt = examplePrompts[Math.floor(Math.random() * examplePrompts.length)];
    promptInput.value = prompt;
    promptInput.focus();
})

// create placeholder cards with loading spinners
createImageCards = (selectedModel, imageCount, aspectRatio, promtText) => {
    gridGallery.innerHTML = ""; //Clear previous images

    for (let i = 0; i < imageCount; i++) {
        gridGallery.innerHTML += `<div class="img-card loading" id="img-card-${i}" style="aspect-ratio: ${aspectRatio}">
                    <div class="status-container">
                        <div class="spinner"></div>
                        <i class="fa-solid fa-triangle-exclamation"></i>
                        <p class="status-text">Generating...</p>
                    </div>
                </div>`;
    }
}

//Handle form submission
const handleFormSubmit = (e) => {
    e.preventDefault();

    //Get form values
    const selectedModel = modelSelect.value;
    const imageCount = parseInt(countSelect.value) || 1;
    const aspectRatio = ratioSelect.value || "1/1";
    const promtText = promptInput.value.trim();

    createImageCards(selectedModel, imageCount, aspectRatio, promtText);
}

promptForm.addEventListener("submit", handleFormSubmit);
themeToggle.addEventListener("click", toggleTheme);