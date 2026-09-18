import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BookOpen, Award, CheckCircle, ChevronRight, FileText } from "lucide-react";

// Curated data for the top defence exams shown
const EXAM_DETAILS = {
  "NDA": {
    theme: {
      primary: "bg-blue-600 text-white",
      accent: "text-blue-600",
      border: "border-blue-100",
      bgLight: "bg-blue-50/50"
    },
    syllabus: [
      {
        subject: "Mathematics (300 Marks)",
        topics: [
          "Algebra (Sets, Venn diagrams, Complex numbers, Quadratic equations, Progressions)",
          "Matrices and Determinants (Operations, Adjoint, Inverse, System of equations)",
          "Trigonometry (Angles, Trigonometric ratios, Identities, Properties of triangles)",
          "Analytical Geometry of 2D and 3D (Cartesian coordinates, Straight line, Circle, Conic sections)",
          "Differential & Integral Calculus (Limits, Continuity, Derivatives, Integration, Area, Differential equations)",
          "Vector Algebra (2D and 3D vectors, Scalar/Vector products)",
          "Statistics & Probability (Measures of central tendency, Dispersion, Probability, Bayes' theorem)"
        ]
      },
      {
        subject: "General Ability Test (GAT) (600 Marks)",
        topics: [
          "Part A: English (200 Marks) - Grammar, Usage, Vocabulary, Comprehension, Cohesion",
          "Part B: General Knowledge (400 Marks) - Divided into Physics, Chemistry, General Science, Social Studies (History, Civics), Geography, and Current Events"
        ]
      }
    ],
    selection: [
      {
        step: "Stage 1: Written Examination",
        desc: "Conducted offline by UPSC (total 900 marks). Paper 1: Mathematics (120 questions, 300 marks) & Paper 2: General Ability Test (150 questions, 600 marks)."
      },
      {
        step: "Stage 2: SSB Interview",
        desc: "5-day evaluation including OIR (Officer Intelligence Rating) tests, PP&DT, Group Tasks, Psychology tests, and Personal Interview (900 marks total)."
      },
      {
        step: "Stage 3: Medical Examination",
        desc: "Thorough health assessment by the Military Medical Board to verify physical and visual standards."
      },
      {
        step: "Stage 4: Final Merit List",
        desc: "Prepared based on combined scores of UPSC Written Exam and SSB Interview, subject to medical fitness."
      }
    ]
  },
  "CDS": {
    theme: {
      primary: "bg-indigo-700 text-white",
      accent: "text-indigo-700",
      border: "border-indigo-100",
      bgLight: "bg-indigo-50/50"
    },
    syllabus: [
      {
        subject: "English (100 Marks)",
        topics: [
          "Understanding of English and workmanlike use of words",
          "Reading Comprehension & Cloze Test",
          "Spotting Errors & Sentence Correction",
          "Synonyms, Antonyms, and Vocabulary usage",
          "Ordering of words in sentences & Ordering of sentences"
        ]
      },
      {
        subject: "General Knowledge (100 Marks)",
        topics: [
          "Current Events (National & International)",
          "Indian History and Culture",
          "Geography (Physical and Indian Geography)",
          "Indian Polity & Constitution",
          "General Science & Everyday Scientific observations"
        ]
      },
      {
        subject: "Elementary Mathematics (100 Marks) [Not for OTA]",
        topics: [
          "Arithmetic (Number system, HCF/LCM, Percentages, Ratio/Proportion, Time/Work, Speed/Time)",
          "Algebra (Theory of equations, HCF/LCM of polynomials, Identities)",
          "Trigonometry (Trigonometric ratios, Simple identities, Heights & Distances)",
          "Geometry & Mensuration (Lines, Angles, Triangles, Circles, Area, Volume of 3D shapes)",
          "Basic Statistics (Collection & tabulation of data, Histograms, Pie charts)"
        ]
      }
    ],
    selection: [
      {
        step: "Stage 1: Written Exam (UPSC)",
        desc: "IMA, INA, AFA candidates take 3 papers: English, GK, Math (300 Marks total). OTA candidates take only English and GK (200 Marks total)."
      },
      {
        step: "Stage 2: SSB Interview",
        desc: "A rigorous 5-day testing process assessing intelligence, personality, compatibility, and leadership traits (300 marks for IMA/INA/AFA, 200 marks for OTA)."
      },
      {
        step: "Stage 3: Document Verification & Medicals",
        desc: "Verification of educational qualifications followed by a comprehensive medical check-up."
      },
      {
        step: "Stage 4: Merit List",
        desc: "Final selection based on combined scores of the written exam and SSB interview, matching vacancy orders."
      }
    ]
  },
  "AFCAT": {
    theme: {
      primary: "bg-sky-600 text-white",
      accent: "text-sky-600",
      border: "border-sky-100",
      bgLight: "bg-sky-50/50"
    },
    syllabus: [
      {
        subject: "General Awareness",
        topics: [
          "History, Geography, Civics, Politics, Defence updates",
          "Basic Sciences & Environment",
          "Art & Culture, Sports achievements & terminology",
          "Current National & International Affairs"
        ]
      },
      {
        subject: "Verbal Ability in English",
        topics: [
          "Comprehension & Paragraph Completion",
          "Detecting Errors, Fill in the blanks",
          "Synonyms, Antonyms, and Vocabulary",
          "Idioms & Phrases, Analogy & One Word Substitution"
        ]
      },
      {
        subject: "Numerical Ability",
        topics: [
          "Decimal Fraction, HCF & LCM",
          "Simple & Compound Interest, Ratio & Proportion",
          "Time & Work, Average, Percentage, Profit & Loss",
          "Time, Speed & Distance (Trains, Boats, Streams)"
        ]
      },
      {
        subject: "Reasoning and Military Aptitude",
        topics: [
          "Verbal Skills and Spatial Ability",
          "Odd One Out, Analogy, Pattern Completion",
          "Venn Diagrams, Blood Relations, Coding-Decoding"
        ]
      }
    ],
    selection: [
      {
        step: "Stage 1: Online Written Test",
        desc: "AFCAT written exam consists of 100 questions of 300 marks (2 hours). Tests English, General Awareness, Numerical Ability, and Reasoning."
      },
      {
        step: "Stage 2: AFSB Interview (5 Days)",
        desc: "Stage I (OIR test & PPDT). Stage II (Psychological tests, Group Tests/GTO, and Interview). CPSS (Computerised Pilot Selection System) is mandatory for Flying Branch."
      },
      {
        step: "Stage 3: Medical Examination",
        desc: "Conducted at IAM Bengaluru or AFCME New Delhi to verify absolute physical and aviation health standards."
      },
      {
        step: "Stage 4: Final Selection & Academy Training",
        desc: "Based on overall written and AFSB marks, joining instructions are sent for Air Force Academy (AFA) Dundigal."
      }
    ]
  },
  "MNS": {
    theme: {
      primary: "bg-rose-700 text-white",
      accent: "text-rose-700",
      border: "border-rose-100",
      bgLight: "bg-rose-50/50"
    },
    syllabus: [
      {
        subject: "General English",
        topics: [
          "Synonyms, Antonyms, Homonyms",
          "Spotting errors, Fill in the blanks, Sentence improvement",
          "Idioms and Phrases, Passage comprehension",
          "One Word Substitution & Active/Passive voice"
        ]
      },
      {
        subject: "General Intelligence & GK",
        topics: [
          "Current National & International events",
          "Important Awards, Authors, Sports, Days",
          "General Science applications, basic Geography and History",
          "Analytical Reasoning & logical interpretation"
        ]
      },
      {
        subject: "Science (Biology, Physics, Chemistry)",
        topics: [
          "Biology: Cell biology, Genetics, Human Physiology, Plant Physiology, Biotechnology, Ecology",
          "Physics: Laws of motion, work, energy, thermodynamics, optics, modern physics",
          "Chemistry: Physical, Organic, and Inorganic Chemistry essentials"
        ]
      }
    ],
    selection: [
      {
        step: "Stage 1: NEET (UG) Shortlisting",
        desc: "Candidates must qualify NEET (UG) exam. Shortlisting for MNS is done strictly based on NEET scores."
      },
      {
        step: "Stage 2: TOGIGE (Written Test)",
        desc: "Test of General Intelligence & General English (TOGIGE) - a computer-based test of 80 marks (40 MCQs, 30 minutes)."
      },
      {
        step: "Stage 3: Psychological Assessment Test (PAT) & Interview",
        desc: "Includes psychological assessments and a personal interview assessing suitability for army nursing commission."
      },
      {
        step: "Stage 4: Medical Examination & Merit List",
        desc: "Rigorous physical standard evaluation by Military Medical Board and final merit generation for BSc Nursing admission."
      }
    ]
  }
};

const ExamSyllabusModal = ({ isOpen, onClose, examTitle, examImageUrl }) => {
  const [activeTab, setActiveTab] = useState("syllabus");
  
  if (!examTitle) return null;

  // Retrieve details or use a default template for any new exam
  const defaultDetails = {
    theme: {
      primary: "bg-slate-700 text-white",
      accent: "text-slate-700",
      border: "border-slate-100",
      bgLight: "bg-slate-50/50"
    },
    syllabus: [
      {
        subject: "Syllabus Details",
        topics: ["The exam syllabus details will be updated shortly by the administration."]
      }
    ],
    selection: [
      {
        step: "Selection Process",
        desc: "The selection criteria and test procedures will be updated shortly."
      }
    ]
  };

  const details = EXAM_DETAILS[examTitle.toUpperCase()] || defaultDetails;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] sm:max-w-2xl bg-white p-0 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 border border-slate-100">
        
        {/* Header Block with theme background */}
        <div className={`p-6 ${details.theme.primary} flex items-center gap-4 relative`}>
          <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center p-2 backdrop-blur-md border border-white/20">
            {examImageUrl ? (
              <img
                src={examImageUrl}
                alt={examTitle}
                className="max-w-full max-h-full object-contain brightness-100 invert-0"
              />
            ) : (
              <Award className="w-8 h-8" />
            )}
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider opacity-85">Upcoming Exam Information</span>
            <DialogTitle className="text-2xl font-extrabold tracking-tight mt-0.5">
              {examTitle} Details
            </DialogTitle>
          </div>
        </div>

        {/* Custom Tabs Navigation */}
        <div className="flex border-b border-slate-100 bg-slate-50/50">
          <button
            onClick={() => setActiveTab("syllabus")}
            className={`flex-1 py-3.5 text-center text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2 ${
              activeTab === "syllabus"
                ? `border-slate-800 text-slate-800 ${details.theme.bgLight}`
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Syllabus
          </button>
          <button
            onClick={() => setActiveTab("selection")}
            className={`flex-1 py-3.5 text-center text-sm font-semibold flex items-center justify-center gap-2 transition-all border-b-2 ${
              activeTab === "selection"
                ? `border-slate-800 text-slate-800 ${details.theme.bgLight}`
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <CheckCircle className="w-4 h-4" />
            Selection Process
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4">
          {activeTab === "syllabus" ? (
            <div className="space-y-5 animate-in fade-in-50 duration-200">
              {details.syllabus.map((subj, idx) => (
                <div key={idx} className={`p-4 rounded-xl border ${details.theme.border} bg-white shadow-sm`}>
                  <h3 className={`font-bold text-base flex items-center gap-2 mb-3 ${details.theme.accent}`}>
                    <FileText className="w-4 h-4" />
                    {subj.subject}
                  </h3>
                  <ul className="space-y-2">
                    {subj.topics.map((topic, tIdx) => (
                      <li key={tIdx} className="text-slate-600 text-xs flex items-start gap-2 leading-relaxed">
                        <ChevronRight className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${details.theme.accent}`} />
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in-50 duration-200">
              {details.selection.map((step, idx) => (
                <div key={idx} className="flex gap-4 p-4 rounded-xl hover:bg-slate-50/50 transition-colors border border-slate-50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${details.theme.primary}`}>
                    {idx + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm mb-1 leading-snug">{step.step}</h4>
                    <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExamSyllabusModal;
