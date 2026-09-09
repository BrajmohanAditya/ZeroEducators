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

// Parse raw text questions (e.g. copied from Word, PDF, or typed directly)
export const parseQuestionsFromRawText = (rawText, defaultSection = "General") => {
  if (!rawText || !rawText.trim()) {
    return {
      questions: [],
      errors: ["Please enter or paste questions text."],
      totalRows: 0,
      validCount: 0,
      invalidCount: 0,
    };
  }

  const cleanText = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  const lines = cleanText.split("\n");

  const isQuestionStart = (line) => {
    const trimmed = line.trim();
    return /^(?:Q(?:uestion)?[\s.:#0-9]*\d+[\s.:)]|\d+[\s.:)])/i.test(trimmed);
  };

  const isOptionLine = (line) => {
    const trimmed = line.trim();
    return /^(?:\(?([A-Ea-e1-5])[\s.):\]\-]|(?:option\s*([A-Ea-e1-5])\s*[:.\-]))/i.test(trimmed);
  };

  const rawBlocks = [];
  let currentBlock = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      if (currentBlock.length > 0) currentBlock.push("");
      continue;
    }

    if (isQuestionStart(trimmed) && currentBlock.length > 0) {
      const hasOption = currentBlock.some((l) => isOptionLine(l));
      if (hasOption) {
        rawBlocks.push(currentBlock.join("\n"));
        currentBlock = [line];
        continue;
      }
    }
    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    rawBlocks.push(currentBlock.join("\n"));
  }

  let blocksToProcess = rawBlocks;
  if (blocksToProcess.length <= 1) {
    const doubleNewlineBlocks = cleanText.split(/\n\s*\n+/).filter((b) => b.trim().length > 0);
    if (doubleNewlineBlocks.length > 1) {
      blocksToProcess = doubleNewlineBlocks;
    }
  }

  const questions = [];
  const errors = [];

  blocksToProcess.forEach((block, bIdx) => {
    const bLines = block.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    if (bLines.length < 2) return;

    let questionLines = [];
    const options = [];
    let answerText = "";
    let explanationLines = [];
    let state = "question";

    for (let lIdx = 0; lIdx < bLines.length; lIdx++) {
      const line = bLines[lIdx];

      // Check Answer line
      const ansMatch = line.match(/^(?:ans(?:wer)?|correct(?:\s*ans(?:wer)?)?|right(?:\s*option)?|ans\.)\s*[:=\-.]?\s*(.*)$/i);
      if (ansMatch && !isOptionLine(line)) {
        answerText = ansMatch[1].trim();
        state = "after_answer";
        continue;
      }

      // Check Explanation line
      const expMatch = line.match(/^(?:explanation|solution|explain|reason)\s*[:=\-.]\s*(.*)$/i);
      if (expMatch) {
        explanationLines.push(expMatch[1].trim());
        state = "explanation";
        continue;
      }

      if (state === "explanation") {
        explanationLines.push(line);
        continue;
      }

      // Check Option line
      const optMatch = line.match(/^(?:\(?([A-Ea-e1-5])[\s.):\]\-]|(?:option\s*([A-Ea-e1-5])\s*[:.\-]))\s*(.*)$/i);
      if (optMatch) {
        state = "options";
        const label = (optMatch[1] || optMatch[2] || "").toUpperCase();
        const text = (optMatch[3] || "").trim();
        options.push({ label, text });
        continue;
      }

      if (state === "question") {
        questionLines.push(line);
      } else if (state === "options" && options.length > 0) {
        options[options.length - 1].text += " " + line;
      }
    }

    let qText = questionLines.join(" ").trim();
    qText = qText.replace(/^(?:Q(?:uestion)?[\s.:#0-9]*\d+[\s.:)]*|\d+[\s.:)]+)\s*/i, "").trim();

    if (!qText) {
      errors.push(`Item ${bIdx + 1}: Question text is missing.`);
      return;
    }

    if (options.length < 2) {
      errors.push(`Question "${qText.substring(0, 30)}...": Needs at least 2 options (A, B).`);
      return;
    }

    let correctIdx = 0;
    const cleanAns = answerText.toUpperCase().trim();
    if (cleanAns) {
      const letterMatch = cleanAns.match(/^([A-E1-5])/);
      if (letterMatch) {
        const char = letterMatch[1];
        const letterMap = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "E" };
        const targetLabel = letterMap[char] || char;
        const found = options.findIndex((o) => o.label === targetLabel);
        if (found !== -1) correctIdx = found;
      } else {
        const found = options.findIndex(
          (o) =>
            o.text.toLowerCase() === cleanAns.toLowerCase() ||
            cleanAns.toLowerCase().includes(o.text.toLowerCase())
        );
        if (found !== -1) correctIdx = found;
      }
    }

    const formattedOptions = options.map((opt, idx) => ({
      text: opt.text,
      isCorrect: idx === correctIdx,
      label: opt.label || String.fromCharCode(65 + idx),
    }));

    questions.push({
      rowNum: questions.length + 1,
      sectionName: defaultSection,
      questionText: qText,
      marks: 1,
      options: formattedOptions,
      correctAnswerLabel: formattedOptions[correctIdx]?.label || "A",
      solutionExplanation: explanationLines.join(" ").trim(),
    });
  });

  return {
    questions,
    errors,
    totalRows: blocksToProcess.length,
    validCount: questions.length,
    invalidCount: errors.length,
  };
};
