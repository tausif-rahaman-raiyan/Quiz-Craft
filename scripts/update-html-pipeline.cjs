const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '../index.html');
let content = fs.readFileSync(indexPath, 'utf-8');

const pipelineCode = `      /**
       * ==========================================
       * CENTRALIZED UNIFIED CONTENT PROCESSING PIPELINE
       * ==========================================
       */
      normalizeBrokenHtmlTags(text) {
        if (text == null) return '';
        let s = String(text)
          .replace(/<\\s*sub\\s*>/gi, '<sub>')
          .replace(/<\\s*\\/\\s*sub\\s*>/gi, '</sub>')
          .replace(/<\\s*sup\\s*>/gi, '<sup>')
          .replace(/<\\s*\\/\\s*sup\\s*>/gi, '</sup>')
          .replace(/<\\s*strong\\s*>/gi, '<strong>')
          .replace(/<\\s*\\/\\s*strong\\s*>/gi, '</strong>')
          .replace(/<\\s*b\\s*>/gi, '<b>')
          .replace(/<\\s*\\/\\s*b\\s*>/gi, '</b>')
          .replace(/<\\s*em\\s*>/gi, '<em>')
          .replace(/<\\s*\\/\\s*em\\s*>/gi, '</em>')
          .replace(/<\\s*i\\s*>/gi, '<i>')
          .replace(/<\\s*\\/\\s*i\\s*>/gi, '</i>')
          .replace(/<\\s*br\\s*\\/?\\s*>/gi, '<br>')
          .replace(/<\\s*\\/?\\s*(?:div|p|span)\\s*>/gi, ' ');

        // Trim inner whitespace inside sub/sup and tighten to chemical letters
        s = s.replace(/<sub>\\s*([^<]+?)\\s*<\\/sub>/gi, '<sub>$1</sub>');
        s = s.replace(/<sup>\\s*([^<]+?)\\s*<\\/sup>/gi, '<sup>$1</sup>');
        s = s.replace(/([a-zA-Z0-9\\)])\\s+<sub>/g, '$1<sub>');
        s = s.replace(/<\\/sub>\\s+([a-zA-Z0-9\\(\\[])/g, '</sub>$1');
        s = s.replace(/([a-zA-Z0-9\\)])\\s+<sup>/g, '$1<sup>');
        s = s.replace(/<\\/sup>\\s+([a-zA-Z0-9\\(\\[])/g, '</sup>$1');
        return s;
      },

      decodeHtmlEntities(text) {
        if (!text) return '';
        return text
          .replace(/&nbsp;/gi, ' ')
          .replace(/&lt;/gi, '<')
          .replace(/&gt;/gi, '>')
          .replace(/&le;/gi, '≤')
          .replace(/&ge;/gi, '≥')
          .replace(/&times;/gi, '×')
          .replace(/&divide;/gi, '÷')
          .replace(/&plusmn;/gi, '±')
          .replace(/&deg;/gi, '°')
          .replace(/&amp;/gi, '&');
      },

      convertMathML(text) {
        if (!text || !/<\\s*math[\\s\\S]*?<\\s*\\/\\s*math\\s*>/i.test(text)) return text;
        return text.replace(/<\\s*math[\\s\\S]*?<\\s*\\/\\s*math\\s*>/gi, (mathTag) => {
          let s = mathTag.replace(/<\\/?math[^>]*>/gi, "");
          s = s.replace(/<semantics[^>]*>|<\\/semantics>|<annotation[^>]*>[\\s\\S]*?<\\/annotation>/gi, "");
          s = s.replace(/<\\/?mstyle[^>]*>/gi, "");
          s = s.replace(/<mspace[^>]*\\/?>(?:<\\/mspace>)?/gi, " ");
          s = s.replace(/⇨|&#x21E8;|&#8680;|&rArr;|\\u21E8|\\u2192|→/g, " → ");

          // Multiscripts / isotopes
          s = s.replace(/<mmultiscripts>\\s*(?:<m[inot]>)?([^<]+)(?:<\\/m[inot]>)?\\s*<mprescripts\\s*(?:\\/|>[\\s\\S]*?<\\/mprescripts>)\\s*<mn>([^<]+)<\\/mn>\\s*<mn>([^<]+)<\\/mn>\\s*<\\/mmultiscripts>/gi,
            (m, base, sub, sup) => " <sup>" + sup + "</sup><sub>" + sub + "</sub>" + base + " "
          );

          // Fractions
          let chg = true;
          while (chg) {
            chg = false;
            s = s.replace(/<mfrac>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/mfrac>/gi, (m, num, den) => {
              chg = true;
              const cleanNum = num.replace(/<[^>]+>/g, "").trim();
              const cleanDen = den.replace(/<[^>]+>/g, "").trim();
              return '<span class="clean-fraction"><span class="c-num">' + cleanNum + '</span><span class="c-den">' + cleanDen + '</span></span>';
            });
          }

          s = s.replace(/<msubsup>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/msubsup>/gi, (m, b, sub, sup) => {
            return " " + b.replace(/<[^>]+>/g, "").trim() + "<sub>" + sub.replace(/<[^>]+>/g, "").trim() + "</sub><sup>" + sup.replace(/<[^>]+>/g, "").trim() + "</sup> ";
          });

          s = s.replace(/<msup>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/msup>/gi, (m, b, sup) => {
            return " " + b.replace(/<[^>]+>/g, "").trim() + "<sup>" + sup.replace(/<[^>]+>/g, "").trim() + "</sup> ";
          });

          s = s.replace(/<msub>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/msub>/gi, (m, b, sub) => {
            return " " + b.replace(/<[^>]+>/g, "").trim() + "<sub>" + sub.replace(/<[^>]+>/g, "").trim() + "</sub> ";
          });

          s = s.replace(/<msqrt>\\s*<m[a-z0-9]+>([\\s\\S]*?)<\\/m[a-z0-9]+>\\s*<\\/msqrt>/gi, (m, inner) => " √(" + inner.replace(/<[^>]+>/g, "").trim() + ") ");

          s = s.replace(/<mo>(?:&#8594;|\\u2192)<\\/mo>/gi, " → ");
          s = s.replace(/<mo>(?:&#8658;|\\u21D2)<\\/mo>/gi, " ⇒ ");
          s = s.replace(/<mo>(?:&prop;|\\u221D)<\\/mo>/gi, " ∝ ");
          s = s.replace(/<mo>(?:&plusmn;|\\u00B1)<\\/mo>/gi, " ± ");
          s = s.replace(/<mo>(?:&times;|\\u00D7)<\\/mo>/gi, " × ");
          s = s.replace(/<mo>(?:&sdot;|\\u22C5)<\\/mo>/gi, " · ");
          s = s.replace(/<mo>(?:&le;|\\u2264)<\\/mo>/gi, " ≤ ");
          s = s.replace(/<mo>(?:&ge;|\\u2265)<\\/mo>/gi, " ≥ ");
          s = s.replace(/<mo>(?:&ne;|\\u2260)<\\/mo>/gi, " ≠ ");

          s = s.replace(/<m[a-z0-9]+[^>]*>/gi, "").replace(/<\\/m[a-z0-9]+>/gi, "");
          return s;
        });
      },

      normalizeChemistry(text) {
        if (!text) return '';
        let s = text;
        s = s.replace(/\\bS\\s+O(?=[0-9_]|\\b)/g, "SO");
        s = s.replace(/\\bC\\s+O(?=[0-9_]|\\b)/g, "CO");
        s = s.replace(/\\bN\\s+H(?=[0-9_]|\\b)/g, "NH");
        s = s.replace(/\\bC\\s+H(?=[0-9_]|\\b)/g, "CH");
        s = s.replace(/\\bC\\s+l(?=[0-9_]|\\b)/g, "Cl");
        s = s.replace(/\\bH\\s+C\\s+l\\b/g, "HCl");
        s = s.replace(/\\bH\\s+N\\s+O(?=[0-9_]|\\b)/g, "HNO");
        s = s.replace(/\\bH\\s+S\\s+O(?=[0-9_]|\\b)/g, "HSO");
        s = s.replace(/\\bN\\s+a\\b/g, "Na");
        s = s.replace(/\\bM\\s+g\\b/g, "Mg");
        s = s.replace(/\\bC\\s+a\\b/g, "Ca");
        s = s.replace(/\\bF\\s+e\\b/g, "Fe");
        s = s.replace(/\\bA\\s+l\\b/g, "Al");
        s = s.replace(/\\bB\\s+a\\b/g, "Ba");

        // Ions & radicals
        s = s.replace(/\\b(Ca|Mg|Fe|Ba|Zn|Cu|Pb)\\s*2\\+/g, "$1<sup>2+</sup>");
        s = s.replace(/\\b(Al|Fe)\\s*3\\+/g, "$1<sup>3+</sup>");
        s = s.replace(/\\b(Na|K|Ag|H|Li)\\s*\\+/g, "$1<sup>+</sup>");
        s = s.replace(/\\b(Cl|Br|I|F|OH)\\s*\\-/g, "$1<sup>-</sup>");
        s = s.replace(/\\b(SO4|SO_4|SO<sub>4<\\/sub>)\\s*2\\-/g, "$1<sup>2-</sup>");
        s = s.replace(/\\b(SO4|SO_4|SO<sub>4<\\/sub>)\\s*²⁻/g, "$1<sup>2-</sup>");
        s = s.replace(/\\b(NO3|NO_3|NO<sub>3<\\/sub>)\\s*\\-/g, "$1<sup>-</sup>");
        s = s.replace(/\\b(CO3|CO_3|CO<sub>3<\\/sub>)\\s*2\\-/g, "$1<sup>2-</sup>");
        s = s.replace(/\\b(PO4|PO_4|PO<sub>4<\\/sub>)\\s*3\\-/g, "$1<sup>3-</sup>");

        return s;
      },

      normalizeLatex(text) {
        if (!text) return '';
        let s = text;

        s = s.replace(/\\\\?\\s*<\\s*\\\\?/g, " < ");
        s = s.replace(/\\\\?\\s*>\\s*\\\\?/g, " > ");
        s = s.replace(/\\\\?\\s*≤\\s*\\\\?/g, " ≤ ");
        s = s.replace(/\\\\?\\s*≥\\s*\\\\?/g, " ≥ ");
        s = s.replace(/\\\\?\\s*=\\s*\\\\?/g, " = ");

        // LaTeX Fractions & Roots
        s = s.replace(/\\\\frac\\s*\\{([^{}]+)\\}\\s*\\{([^{}]+)\\}/gi, (m, num, den) => {
          return '<span class="clean-fraction"><span class="c-num">' + num + '</span><span class="c-den">' + den + '</span></span>';
        });
        s = s.replace(/\\\\sqrt\\s*\\{([^{}]+)\\}/gi, (m, inner) => "√(" + inner + ")");

        // LaTeX Symbols
        s = s
          .replace(/\\\\times\\b/g, "×")
          .replace(/\\\\div\\b/g, "÷")
          .replace(/\\\\pm\\b/g, "±")
          .replace(/\\\\mp\\b/g, "∓")
          .replace(/\\\\approx\\b/g, "≈")
          .replace(/\\\\propto\\b/g, "∝")
          .replace(/\\\\ne(?:q)?\\b/g, "≠")
          .replace(/\\\\le(?:q)?\\b/g, "≤")
          .replace(/\\\\ge(?:q)?\\b/g, "≥")
          .replace(/\\\\rightarrow\\b|\\\\to\\b/g, "→")
          .replace(/\\\\Rightarrow\\b/g, "⇒")
          .replace(/\\\\leftarrow\\b/g, "←")
          .replace(/\\\\leftrightarrow\\b/g, "↔")
          .replace(/\\\\Leftrightarrow\\b/g, "⇔")
          .replace(/\\\\degree\\b|\\^\\\\circ/g, "°")
          .replace(/\\\\infty\\b/g, "∞")
          .replace(/\\\\alpha\\b/g, "α")
          .replace(/\\\\beta\\b/g, "β")
          .replace(/\\\\gamma\\b/g, "γ")
          .replace(/\\\\delta\\b/g, "δ")
          .replace(/\\\\Delta\\b/g, "Δ")
          .replace(/\\\\lambda\\b/g, "λ")
          .replace(/\\\\mu\\b/g, "μ")
          .replace(/\\\\pi\\b/g, "π")
          .replace(/\\\\rho\\b/g, "ρ")
          .replace(/\\\\sigma\\b/g, "σ")
          .replace(/\\\\theta\\b/g, "θ")
          .replace(/\\\\omega\\b/g, "ω")
          .replace(/\\\\Omega\\b/g, "Ω");

        // LaTeX sub / sup
        s = s.replace(/_\\{([^}]+)\\}/g, "<sub>$1</sub>");
        s = s.replace(/\\^\\{([^}]+)\\}/g, "<sup>$1</sup>");
        s = s.replace(/\\^([0-9\\+\\-]+)/g, "<sup>$1</sup>");

        // Clean trailing escapes
        s = s.replace(/\\\\\\s+/g, " ");
        s = s.replace(/\\\\([a-zA-Z]+)/g, "$1");
        s = s.replace(/\\\\/g, "");

        return s;
      },

      sanitizeContent(text) {
        if (!text) return '';
        let s = text;
        s = s.replace(/<\\s*(?:script|iframe|object|embed|applet)[\\s\\S]*?<\\s*\\/\\s*(?:script|iframe|object|embed|applet)\\s*>/gi, "");
        s = s.replace(/<\\s*(?:script|iframe|object|embed|applet)[^>]*>/gi, "");
        s = s.replace(/\\bon[a-z]+\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)/gi, "");
        s = s.replace(/javascript:[^"'\\s>]+/gi, "#");
        return s;
      },

      processQuestionContent(text, options = {}) {
        if (text == null) return '';
        const isExplanation = typeof options === 'boolean' ? options : (options && options.isExplanation);
        let val = String(text);

        val = this.normalizeBrokenHtmlTags(val);
        val = this.decodeHtmlEntities(val);
        val = this.convertMathML(val);
        val = this.normalizeChemistry(val);
        val = this.normalizeLatex(val);
        val = this.sanitizeContent(val);
        val = val.replace(/[ \\t]{2,}/g, " ").trim();

        if (isExplanation || val.includes('রেফারেন্স') || val.includes('কনসেপ্ট') || val.includes('ধারণা')) {
          val = val.replace(/(?:<b>|<strong>)?(?:রেফারেন্স|Reference)[:\\-–]?(?:<\\/b>|<\\/strong>)?/gi, 
            '<span class="badge-reference"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>রেফারেন্স:</span> ');
          val = val.replace(/(?:<b>|<strong>)?(?:কনসেপ্ট|Concept|ধারণা)[:\\-–]?(?:<\\/b>|<\\/strong>)?/gi, 
            '<span class="badge-concept"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z"/><path d="M9 21h6"/></svg>কনসেপ্ট:</span> ');
        }

        return val;
      },

      formatMathAndFractions(text, isExplanation = false) {
        return this.processQuestionContent(text, { isExplanation });
      },

      normalizeLetter(raw) {
        if (!raw) return 'A';
        const map = {
          'ক': 'A', 'খ': 'B', 'গ': 'C', 'ঘ': 'D', 'ঙ': 'E',
          '১': 'A', '২': 'B', '৩': 'C', '৪': 'D',
          '1': 'A', '2': 'B', '3': 'C', '4': 'D',
          'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E'
        };
        const clean = String(raw).trim().toUpperCase();
        return map[clean] || (map[clean[0]] || 'A');
      },`;

// Replace from formatMathAndFractions to normalizeLetter(raw)
const regex = /\/\*\*[\s\S]*?formatMathAndFractions\(text[\s\S]*?normalizeLetter\(raw\)\s*\{[\s\S]*?\},/;
content = content.replace(regex, pipelineCode);

fs.writeFileSync(indexPath, content, 'utf-8');
console.log('✅ Integrated centralized content pipeline into index.html');
