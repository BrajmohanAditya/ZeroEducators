/**
 * RFC-4180 Compliant CSV Parser & Questions Template Generator
 */

// Parse a single CSV line accounting for quotes and commas
export const parseCSVLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
};

// Parse complete CSV text (handles multi-line quoted fields properly)
export const parseCSVText = (text) => {
  if (!text) return [];
  // Strip BOM if present
  const cleanText = text.replace(/^\uFEFF/, "");

  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField.trim());
      currentField = "";
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i++; // Skip CRLF
      }
      currentRow.push(currentField.trim());
      if (currentRow.some((field) => field.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((field) => field.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
};

// Map parsed rows into formatted quiz questions
export const parseQuestionsFromCSV = (csvText, defaultSection = "General") => {
  const rows = parseCSVText(csvText);
  if (rows.length < 2) {
    return {
      questions: [],
      errors: ["CSV file is empty or missing data rows."],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
    };
  }

  // Header matching
  const headers = rows[0].map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""));

  const findColIndex = (candidates) => {
    return headers.findIndex((h) => candidates.some((cand) => h.includes(cand)));
  };

  const sectionIdx = findColIndex(["section", "category", "subject"]);
  const questionIdx = findColIndex(["questiontext", "question", "title", "qtext"]);
  const marksIdx = findColIndex(["mark", "point", "score"]);
  const optAIdx = findColIndex(["optiona", "option1", "opta", "opt1"]);
  const optBIdx = findColIndex(["optionb", "option2", "optb", "opt2"]);
  const optCIdx = findColIndex(["optionc", "option3", "optc", "opt3"]);
  const optDIdx = findColIndex(["optiond", "option4", "optd", "opt4"]);
  const ansIdx = findColIndex(["correct", "answer", "ans", "rightoption"]);
  const explanationIdx = findColIndex(["explanation", "solution", "explain", "reason"]);

  if (questionIdx === -1 || optAIdx === -1 || optBIdx === -1) {
    return {
      questions: [],
      errors: [
        "Required columns missing. Please make sure headers contain: questionText, optionA, optionB, optionC, optionD, correctAnswer.",
      ],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
    };
  }

  const questions = [];
  const errors = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;

    const questionText = row[questionIdx] || "";
    if (!questionText.trim()) {
      continue; // Skip empty row
    }

    const sectionName =
      (sectionIdx !== -1 && row[sectionIdx] ? row[sectionIdx].trim() : "") ||
      defaultSection;
    const marks = marksIdx !== -1 && Number(row[marksIdx]) > 0 ? Number(row[marksIdx]) : 1;

    const optA = (optAIdx !== -1 ? row[optAIdx] : "") || "";
    const optB = (optBIdx !== -1 ? row[optBIdx] : "") || "";
    const optC = (optCIdx !== -1 ? row[optCIdx] : "") || "";
    const optD = (optDIdx !== -1 ? row[optDIdx] : "") || "";

    const rawAns = (ansIdx !== -1 && row[ansIdx] ? row[ansIdx].trim().toUpperCase() : "") || "A";
    const explanation = explanationIdx !== -1 && row[explanationIdx] ? row[explanationIdx].trim() : "";

    const rawOptions = [
      { text: optA, label: "A" },
      { text: optB, label: "B" },
      { text: optC, label: "C" },
      { text: optD, label: "D" },
    ].filter((o) => o.text && o.text.trim().length > 0);

    if (rawOptions.length < 2) {
      errors.push(`Row ${rowNum}: Needs at least 2 options (A and B).`);
      continue;
    }

    // Determine which option is correct
    // Supports "A", "B", "C", "D" or "1", "2", "3", "4" or option text
    let correctIdx = 0;
    if (rawAns === "A" || rawAns === "1" || rawAns.startsWith("A)")) correctIdx = 0;
    else if (rawAns === "B" || rawAns === "2" || rawAns.startsWith("B)")) correctIdx = 1;
    else if (rawAns === "C" || rawAns === "3" || rawAns.startsWith("C)")) correctIdx = 2;
    else if (rawAns === "D" || rawAns === "4" || rawAns.startsWith("D)")) correctIdx = 3;
    else {
      // Try matching by option text
      const matchedIdx = rawOptions.findIndex(
        (o) => o.text.toLowerCase() === rawAns.toLowerCase()
      );
      if (matchedIdx !== -1) correctIdx = matchedIdx;
    }

    // Ensure valid correct index
    if (correctIdx >= rawOptions.length) {
      correctIdx = 0;
    }

    const options = rawOptions.map((opt, idx) => ({
      text: opt.text.trim(),
      isCorrect: idx === correctIdx,
      label: opt.label,
    }));

    questions.push({
      rowNum,
      sectionName,
      questionText: questionText.trim(),
      marks,
      options,
      correctAnswerLabel: rawOptions[correctIdx]?.label || "A",
      solutionExplanation: explanation,
    });
  }

  return {
    questions,
    errors,
    totalRows: rows.length - 1,
    validCount: questions.length,
    invalidCount: errors.length,
  };
};

// Download ready-to-use CSV template for Microsoft Excel / Google Sheets
export const downloadSampleQuestionsCSV = (sections = []) => {
  const section1 = sections[0]?.name || "Reasoning";
  const section2 = sections[1]?.name || (sections[0]?.name ? sections[0].name : "Quantitative Aptitude");

  const sampleRows = [
    [
      "sectionName",
      "questionText",
      "marks",
      "optionA",
      "optionB",
      "optionC",
      "optionD",
      "correctAnswer",
      "explanation",
    ],
    [
      section1,
      "What comes next in the sequence: 2, 4, 8, 16, ...?",
      "1",
      "24",
      "32",
      "30",
      "36",
      "B",
      "Each term is multiplied by 2: 16 * 2 = 32.",
    ],
    [
      section1,
      "If CAT is coded as 3120, what is the code for DOG?",
      "1",
      "4157",
      "4156",
      "3147",
      "4167",
      "A",
      "Alphabet positions: D=4, O=15, G=7, so code is 4157.",
    ],
    [
      section2,
      "Find the value of x if 3x + 15 = 45.",
      "1",
      "5",
      "10",
      "15",
      "20",
      "B",
      "3x = 45 - 15 = 30 => x = 10.",
    ],
    [
      section2,
      "What is 20% of 250?",
      "1",
      "40",
      "50",
      "60",
      "45",
      "B",
      "20% of 250 = (20/100) * 250 = 50.",
    ],
  ];

  // Format as CSV with proper quoting
  const csvContent =
    "\uFEFF" + // UTF-8 BOM so Excel opens Hindi and special characters cleanly
    sampleRows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell || "");
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
          })
          .join(",")
      )
      .join("\r\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "quiz_questions_template.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
