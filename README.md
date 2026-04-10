# STR Score 🏠

**STR Score** is a lightweight browser extension (Manifest V3) designed to help travelers quickly evaluate the value of Airbnb listings. Instead of just looking at the nightly price, this tool calculates a weighted "Value Score" based on the total stay cost, star ratings, and review volume.

## 🧐 What is the STR Score?

The extension scrapes the listing page to find the total price (including nights and fees), the average rating, and the number of reviews. It then applies the following formula:

$$Value Score = \frac{Total Price \times 1000}{Stars \times Reviews}$$

### Why this formula?
* **Price:** Lower prices result in a better (lower) score.
* **Stars:** Higher ratings decrease the score, indicating better quality.
* **Reviews:** A high number of reviews acts as a "confidence multiplier," lowering the score to show the rating is well-vetted.

> **Rule of Thumb:** A **lower** score indicates better relative value.

---

## ✨ Features
* **Automatic Extraction:** Automatically detects price, stars, and review counts on Airbnb listing pages.
* **Total Price Focus:** Prioritizes the "Total" stay price over the nightly rate to give you a realistic cost assessment.
* **Live Updates:** Recalculates dynamically as you change dates or navigate between listings.
* **Clean UI:** A non-intrusive, modern widget that sits in the corner of your screen.

---

## 🛠️ Installation

### For Developers (Firefox)
1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/str-score.git
    ```
2.  Open Firefox and type `about:debugging` in the address bar.
3.  Click on **"This Firefox"**.
4.  Click **"Load Temporary Add-on..."**.
5.  Select the `manifest.json` file from the project folder.

---

## 📂 Project Structure
* `manifest.json`: The extension configuration (Manifest V3).
* `content.js`: The "brain" of the extension that handles data scraping and score calculation.
* `widget.css`: The styling for the floating STR Score panel.
* `icon48.png` / `icon96.png`: Extension icons.

---

## ⚠️ Limitations & Notes
* **Date Selection:** For the most accurate "Total Price" calculation, ensure you have selected travel dates on the Airbnb page.
* **Regional Formats:** The extension is designed to parse various currency symbols ($ € £ ¥ ₹) and numerical formats.

---

## 🤝 Contributing
Contributions are welcome! If you find a bug or have an idea for a better value formula, please open an issue or submit a pull request. 

---

## 📜 License
This project is open-source. (e.g., MIT License)
