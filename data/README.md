# 🗄️ Kanji Database Structure & Maintenance

## 📝 How to Edit Kanji Data (Source of Truth)

Do **NOT** manually edit `kanji.json` or `kanji.min.json`. Those are generated bundles and any manual edits will be overwritten.

The true source of truth is located in the `kanji-levels/` directory. The data is split by Kanken levels to make it easy to edit without freezing your code editor:

- `kanken-10.json` (Grade 1 Joyo)
- `kanken-9.json` (Grade 2 Joyo)
- ...
- `kanken-1.json` (Non-Joyo, Kanken 1)

**To edit or add a Kanji:**

1. Open the corresponding `kanken-*.json` file.
2. Edit the data safely using standard JSON format.
3. Save the file.

## 🚀 How to Build the Website Data (Optimization)

After editing any file in `kanji-levels/`, you must compile them into the optimized format used by the website to ensure fast loading.

Run the build script from the project root:

```bash
python3 scripts/build-data.py
```

**What the script does:**

1. Merges all 12 level files into a single bundle.
2. Minifies the JSON by stripping all whitespace and indentation.
3. Outputs `data/kanji.min.json` (reduces size from 3.5MB down to 2.4MB plaintext, or ~138KB over the network with gzip).

The website (`assets/js/search.js`) is configured to fetch only the optimized `kanji.min.json` file.
