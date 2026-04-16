/* ===================================================
   evaluator.js — Local Evaluation Engine v3
   100% Local — No External API Required
   Intelligent rubric-based scoring engine
   Uses: keyword analysis, structural pattern detection,
         topic modelling, and feedback generation
   =================================================== */

/* ── Domain Keyword Banks ───────────────────────── */
const DOMAIN_KEYWORDS = {
  algorithm:   ['algorithm','step','process','procedure','method','approach','solution','compute','calculate','technique'],
  flowchart:   ['start','end','stop','begin','decision','yes','no','flow','branch','diamond','oval','rectangle','arrow','connector'],
  pseudocode:  ['if','else','then','while','for','do','repeat','until','input','output','read','write','print','return','function','procedure','begin','end','call','declare'],
  logic:       ['condition','true','false','check','compare','greater','less','equal','and','or','not','boolean','flag'],
  structure:   ['initialize','set','declare','assign','increment','decrement','counter','index','array','list','pointer','variable'],
  io:          ['input','output','read','write','print','display','enter','get','put','store','show','return','result'],
  loop:        ['while','for','repeat','until','loop','iterate','each','next','continue','break','do','cycle','recursion'],
  condition:   ['if','else','elif','switch','case','when','condition','check','test','compare','decision','branch','otherwise'],
  sorting:     ['sort','sorted','swap','compare','pivot','merge','bubble','insertion','selection','quick','heap','order','ordered','ascending','descending','exchange','pass'],
  search:      ['search','find','locate','index','key','target','match','compare','binary','linear','sequential','mid','low','high','found','not found'],
  complexity:  ['complexity','time','space','big','efficient','optimal','worst','best','average','performance','o(n)','o(log','o(1)'],
  stack:       ['stack','push','pop','peek','top','overflow','underflow','lifo','full','empty','isEmpty','size','capacity'],
  queue:       ['queue','enqueue','dequeue','front','rear','circular','fifo','full','empty'],
  tree:        ['tree','node','root','leaf','parent','child','left','right','height','depth','traverse','inorder','preorder','postorder','bst'],
  graph:       ['graph','vertex','edge','adjacent','path','cycle','directed','weighted','bfs','dfs','visit','visited'],
  recursion:   ['recursion','recursive','base case','call','return','factorial','fibonacci','stack frame'],
  correctness: ['correct','valid','proper','accurate','precise','exact','right','error','bug','handle','check','verify'],
};

/* ── Structural Pattern Detectors ───────────────── */
const STRUCTURAL = {
  hasStart:         (s) => /\b(start|begin|initialize|step\s*1\b|^\s*1[\.\)])/mi.test(s),
  hasEnd:           (s) => /\b(end|stop|finish|terminate|return|halt)\b/i.test(s),
  hasNumberedSteps: (s) => /^\s*(\d+[\.\):]|\bstep\s*\d+\b)/mi.test(s),
  hasConditions:    (s) => /\b(if|else|elif|when|case|switch|otherwise)\b/i.test(s),
  hasLoops:         (s) => /\b(while|for|repeat|until|loop|iterate|do\b)/i.test(s),
  hasIO:            (s) => /\b(input|output|read|write|print|display|get|put|show|enter)\b/i.test(s),
  hasVariables:     (s) => /\b(set|let|var|declare|initialize|assign)\b|\w+\s*=\s*\w+/i.test(s),
  hasFunctions:     (s) => /\b(function|procedure|method|routine|subroutine|call)\b/i.test(s),
  hasComments:      (s) => /\/\/|#\s+\w|--\s+\w|\/\*/.test(s),
  hasComparisons:   (s) => /[><=!]=?|<>|\b(greater|less|equal|not equal|compare)\b/i.test(s),
  hasSwap:          (s) => /\b(swap|exchange|temp|temporary)\b/i.test(s),
  hasReturn:        (s) => /\b(return|output|result|answer)\b/i.test(s),
  hasErrorHandling: (s) => /\b(overflow|underflow|error|invalid|empty|full|check|verify|handle)\b/i.test(s),
};

/* ── Main Evaluate Function (async wrapper) ─────── */
async function evaluateSubmission(submission, rubric) {
  // Simulate "thinking" time for UX
  await new Promise(r => setTimeout(r, 900 + Math.random() * 600));
  return localEvaluate(submission, rubric);
}

/* ── Smart Local Evaluator ──────────────────────── */
function localEvaluate(submission, rubric) {
  const content   = submission.content || '';
  const cLower    = content.toLowerCase();
  const words     = cLower.split(/\s+/).filter(w => w.length > 1);
  const wordCount = words.length;
  const lines     = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const lineCount = lines.length;

  // Run all structural checks once
  const struct = {};
  for (const [k, fn] of Object.entries(STRUCTURAL)) {
    struct[k] = fn(content);
  }

  // Detect domain context from submission + rubric title
  const rubricContext = (rubric.title + ' ' + (rubric.description || '')).toLowerCase();
  const detectedDomains = detectDomains(cLower + ' ' + rubricContext);

  // Evaluate each criterion
  const criteria = rubric.criteria.map(rc =>
    evaluateCriterion(rc, cLower, words, wordCount, lineCount, struct, detectedDomains)
  );

  const totalScore = criteria.reduce((s, c) => s + c.awarded, 0);

  return {
    totalScore,
    totalMarks: rubric.totalMarks,
    criteria,
    strengths:   buildStrengths(struct, wordCount, lineCount, criteria, totalScore, rubric.totalMarks),
    weaknesses:  buildWeaknesses(struct, wordCount, lineCount, criteria, totalScore, rubric.totalMarks),
    suggestions: buildSuggestions(struct, wordCount, lineCount, criteria),
  };
}

/* ── Criterion Evaluator ─────────────────────────── */
function evaluateCriterion(rc, cLower, words, wordCount, lineCount, struct, detectedDomains) {
  const cName   = rc.name.toLowerCase();
  const cDesc   = (rc.description || '').toLowerCase();
  const maxMarks = rc.marks;

  // 1. Extract targeted keywords from criterion name + description
  const targetKws  = extractTargetKeywords(cName, cDesc);
  const matched    = targetKws.filter(kw => cLower.includes(kw));
  const kwRatio    = targetKws.length > 0 ? matched.length / targetKws.length : 0;

  // 2. Domain relevance score
  const relDomains  = pickRelevantDomains(cName, cDesc);
  let domainScore   = 0;
  for (const dom of relDomains) {
    const bank = DOMAIN_KEYWORDS[dom] || [];
    const hits = bank.filter(kw => cLower.includes(kw)).length;
    domainScore += Math.min(hits / Math.max(bank.length * 0.25, 1), 1);
  }
  const avgDomain = relDomains.length ? domainScore / relDomains.length : 0;

  // 3. Structural bonuses — specific to what the criterion tests
  let structBonus = computeStructuralBonus(cName, cDesc, struct);

  // 4. Submission detail score (longer = more likely complete)
  const detailScore = Math.min(wordCount / 100, 1) * 0.15;

  // 5. Line organisation bonus
  const orgScore = (struct.hasNumberedSteps || lineCount >= 5) ? 0.05 : 0;

  // Combine weights
  const rawScore = (kwRatio * 0.40) + (avgDomain * 0.25) + (structBonus * 0.20) + (detailScore) + (orgScore);
  const clamped  = Math.min(Math.max(rawScore, 0), 1);

  // Penalty for extremely short submissions
  const adjusted = wordCount < 10 ? clamped * 0.25
                 : wordCount < 20 ? clamped * 0.55
                 : clamped;

  const awarded = Math.min(Math.round(adjusted * maxMarks), maxMarks);
  const feedback = generateFeedback(rc, awarded, maxMarks, targetKws, matched, struct, wordCount, lineCount);

  return { id: rc.id, name: rc.name, awarded, max: maxMarks, feedback };
}

/* ── Keyword Extractor ───────────────────────────── */
function extractTargetKeywords(name, desc) {
  const STOP = new Set(['the','and','or','of','in','to','for','a','an','is','are','be',
                        'that','this','with','on','at','by','from','as','it','its',
                        'which','any','each','all','per','not','both']);
  const base = (name + ' ' + desc)
    .replace(/[^a-z0-9\s\-\/]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w));

  // Synonym / expansion map
  const expansions = {
    sort:       ['sort','sorted','sorting','order','ordered','ascending','descending'],
    search:     ['search','find','locate','found','target'],
    loop:       ['loop','while','for','repeat','until','iterate','iteration'],
    condition:  ['if','else','condition','check','decision','branch'],
    input:      ['input','read','enter','get','receive'],
    output:     ['output','print','display','write','show','result'],
    init:       ['initialize','set','declare','start','begin'],
    swap:       ['swap','exchange','temp','temporary'],
    mid:        ['mid','middle','midpoint','floor','div','half'],
    low:        ['low','left','start','min'],
    high:       ['high','right','end','max'],
    push:       ['push','insert','add','top'],
    pop:        ['pop','remove','delete','top'],
    peek:       ['peek','top','look'],
    overflow:   ['overflow','full','size','capacity'],
    underflow:  ['underflow','empty','size'],
    comparison: ['compare','greater','less','equal','if','condition'],
    clarity:    ['clear','label','step','numbered','comment','readable'],
    return:     ['return','output','result','answer','index'],
    termination:['stop','end','terminate','low','high','found','condition'],
    complexity: ['complexity','time','space','efficient','optimal','o(n)'],
  };

  const extra = [];
  for (const [key, syns] of Object.entries(expansions)) {
    if (name.includes(key) || desc.includes(key)) {
      extra.push(...syns);
    }
  }

  return [...new Set([...base, ...extra])];
}

/* ── Domain Detector ─────────────────────────────── */
function detectDomains(text) {
  const domains = [];
  const t = text.toLowerCase();
  if (/sort|bubble|selection|insertion|merge|quick/.test(t))  domains.push('sorting');
  if (/search|binary|linear|sequential/.test(t))              domains.push('search');
  if (/stack|push|pop|peek/.test(t))                          domains.push('stack');
  if (/queue|enqueue|dequeue/.test(t))                        domains.push('queue');
  if (/tree|node|bst|traverse/.test(t))                       domains.push('tree');
  if (/graph|vertex|edge|bfs|dfs/.test(t))                    domains.push('graph');
  if (/recursion|recursive|base case/.test(t))                domains.push('recursion');
  if (/loop|while|for|repeat/.test(t))                        domains.push('loop');
  if (/if|else|condition|branch/.test(t))                     domains.push('condition');
  if (/flowchart|flow chart|diagram/.test(t))                 domains.push('flowchart');
  if (/pseudocode|pseudo|algorithm/.test(t))                  domains.push('pseudocode','algorithm');
  return [...new Set(domains)];
}

/* ── Domain Picker for Criterion ─────────────────── */
function pickRelevantDomains(name, desc) {
  const text = name + ' ' + desc;
  const domains = [];
  const t = text.toLowerCase();
  if (/sort|swap|bubble|order/.test(t))           domains.push('sorting');
  if (/search|find|low|high|mid|binary/.test(t))  domains.push('search');
  if (/loop|iter|while|for|repeat/.test(t))       domains.push('loop');
  if (/cond|branch|decision|if|else/.test(t))     domains.push('condition');
  if (/input|output|io|read|write|display/.test(t)) domains.push('io');
  if (/complex|efficien|optim/.test(t))           domains.push('complexity');
  if (/push|pop|stack|overflow|underflow/.test(t)) domains.push('stack');
  if (/queue|enqueue|dequeue|front|rear/.test(t)) domains.push('queue');
  if (/tree|node|traverse/.test(t))               domains.push('tree');
  if (/recur/.test(t))                            domains.push('recursion');
  if (/pseudo|algo|step|process/.test(t))         domains.push('algorithm','pseudocode');
  if (/flowchart|flow|diagram/.test(t))           domains.push('flowchart');
  if (/var|declar|init|assign|set/.test(t))       domains.push('structure');
  if (/correct|valid|accurat|error/.test(t))      domains.push('correctness');
  if (/logic|bool|flag|true|false/.test(t))       domains.push('logic');
  if (domains.length === 0) domains.push('algorithm');
  return [...new Set(domains)];
}

/* ── Structural Bonus Computation ────────────────── */
function computeStructuralBonus(name, desc, struct) {
  let bonus = 0;
  const t = name + ' ' + desc;
  const has = (terms) => terms.some(term => t.includes(term));

  if (has(['start','end','begin','terminat','node']))    { bonus += struct.hasStart ? 0.25 : 0; bonus += struct.hasEnd ? 0.25 : 0; }
  if (has(['structure','format','organ','step','sequence','order','clarity','label'])) {
    if (struct.hasNumberedSteps) bonus += 0.30;
    if (struct.hasStart && struct.hasEnd) bonus += 0.15;
  }
  if (has(['input','output','io','read','write','display'])) { if (struct.hasIO) bonus += 0.45; }
  if (has(['condition','branch','decision','if','else','compar'])) { if (struct.hasConditions) bonus += 0.40; if (struct.hasComparisons) bonus += 0.10; }
  if (has(['loop','iter','repeat','while','for','cycle'])) { if (struct.hasLoops) bonus += 0.45; }
  if (has(['var','declar','init','assign','set'])) { if (struct.hasVariables) bonus += 0.40; }
  if (has(['swap','exchange','temp'])) { if (struct.hasSwap) bonus += 0.45; }
  if (has(['return','result','output','answer','index','terminat','stop'])) { if (struct.hasReturn) bonus += 0.35; }
  if (has(['overflow','underflow','empty','full','valid','error','check'])) { if (struct.hasErrorHandling) bonus += 0.40; }
  if (has(['function','procedure','method','subprogram'])) { if (struct.hasFunctions) bonus += 0.40; }
  if (has(['comment','readable','clear','explain'])) { if (struct.hasComments) bonus += 0.40; }

  return Math.min(bonus, 0.70);
}

/* ── Criterion Feedback Generator ───────────────── */
function generateFeedback(rc, awarded, maxMarks, targetKws, matched, struct, wordCount, lineCount) {
  const pct     = maxMarks > 0 ? awarded / maxMarks : 0;
  const missing = targetKws.filter(k => !matched.includes(k)).slice(0, 5);
  const found   = matched.slice(0, 5);
  const name    = rc.name;
  const cName   = name.toLowerCase();
  let fb        = '';

  if (pct >= 0.85) {
    fb = `"${name}" is fully and correctly addressed. `;
    if (found.length > 0) fb += `Key elements correctly present: ${found.join(', ')}. `;
    fb += wordCount > 70
      ? 'The submission is detailed and demonstrates thorough understanding of this criterion.'
      : 'All essential aspects of this criterion are present and correctly applied.';
  } else if (pct >= 0.60) {
    fb = `"${name}" is adequately covered but has some gaps. `;
    if (found.length > 0) fb += `Detected correctly: ${found.join(', ')}. `;
    if (missing.length > 0) fb += `Missing or unclear elements: ${missing.join(', ')}. `;
    fb += 'Overall, the submission satisfies the core requirement but could be more thorough or explicit.';
  } else if (pct >= 0.30) {
    fb = `"${name}" is partially addressed with notable deficiencies. `;
    if (found.length > 0) fb += `Some elements found: ${found.join(', ')}. `;
    else fb += 'Very few relevant elements detected for this criterion. ';
    if (missing.length > 0) fb += `Key missing elements: ${missing.join(', ')}. `;
    fb += 'Significant revision is required to fully satisfy this criterion according to the rubric.';
  } else {
    fb = `"${name}" is not addressed or is critically incomplete. `;
    if (missing.length > 0) fb += `Expected elements not found: ${missing.join(', ')}. `;
    fb += wordCount < 20
      ? 'The submission is too brief for this criterion to be evaluated fairly — expand your response significantly.'
      : 'Ensure this criterion is explicitly and correctly handled in your submission.';
  }

  // Append targeted structural notes
  if (/structure|steps|format|organ|sequence|clarity|label/.test(cName) && !struct.hasNumberedSteps)
    fb += ' Structured numbered steps (e.g., Step 1, Step 2…) are recommended for clarity.';
  if (/condition|decision|branch/.test(cName) && !struct.hasConditions)
    fb += ' No IF/ELSE or conditional logic was detected — decision handling needs to be included.';
  if (/loop|iter|repeat/.test(cName) && !struct.hasLoops)
    fb += ' No loop constructs (WHILE/FOR/REPEAT) were detected.';
  if (/swap|exchange/.test(cName) && !struct.hasSwap)
    fb += ' No swap or exchange operation (e.g., using a temp variable) was detected.';
  if (/input|output/.test(cName) && !struct.hasIO)
    fb += ' Input and output statements must be explicitly defined.';
  if (/overflow|underflow|error|valid/.test(cName) && !struct.hasErrorHandling)
    fb += ' Error or boundary condition handling was not found.';

  return fb;
}

/* ── Strengths Builder ───────────────────────────── */
function buildStrengths(struct, wordCount, lineCount, criteria, totalScore, totalMarks) {
  const out  = [];
  const pct  = totalMarks > 0 ? totalScore / totalMarks : 0;
  const high = criteria.filter(c => c.awarded / c.max >= 0.75);

  if (struct.hasNumberedSteps)             out.push('Clear numbered steps are used, making the logic easy to follow and evaluate.');
  if (struct.hasStart && struct.hasEnd)    out.push('Proper START and END markers are present, correctly bounding the algorithm.');
  if (struct.hasConditions)               out.push('Conditional logic (IF/ELSE) is included, demonstrating decision-making capability.');
  if (struct.hasLoops)                    out.push('Loop or iteration constructs are present, showing understanding of repetition.');
  if (struct.hasIO)                       out.push('Input and Output operations are defined, indicating awareness of data flow.');
  if (struct.hasSwap)                     out.push('A proper swap/exchange mechanism is included using a temporary variable.');
  if (struct.hasVariables)               out.push('Variables are declared and assigned appropriately.');
  if (struct.hasReturn)                  out.push('The algorithm produces a clear final result or return value.');
  if (struct.hasErrorHandling)           out.push('Boundary or error conditions (overflow/underflow/empty/full) are handled.');
  if (struct.hasComments)               out.push('Pseudocode/algorithm includes comments or annotations for readability.');
  if (wordCount > 80)                   out.push('The submission is detailed and comprehensive in its explanation of the solution.');
  if (lineCount >= 8)                   out.push('Well-structured submission with multiple clearly organised lines/steps.');
  if (high.length > 0 && pct >= 0.65)  out.push(`${high.length} of ${criteria.length} criteria are well handled in this submission.`);

  if (out.length === 0) {
    out.push('Submission was received and an attempt was made by the student.');
    if (wordCount > 5) out.push('Some relevant content is present that can be built upon.');
  }

  return out.slice(0, 4);
}

/* ── Weaknesses Builder ──────────────────────────── */
function buildWeaknesses(struct, wordCount, lineCount, criteria, totalScore, totalMarks) {
  const out  = [];
  const pct  = totalMarks > 0 ? totalScore / totalMarks : 0;
  const poor = criteria.filter(c => c.awarded / c.max < 0.4);

  if (!struct.hasStart)           out.push('No clear START or BEGIN marker — every algorithm must have a defined entry point.');
  if (!struct.hasEnd)             out.push('No END or STOP marker — the algorithm lacks a defined termination point.');
  if (!struct.hasNumberedSteps && lineCount < 5)
                                  out.push('Submission lacks numbered steps or clear structure, making the sequence difficult to follow.');
  if (!struct.hasConditions)      out.push('No conditional logic (IF/ELSE) detected — decision points in the algorithm are absent.');
  if (!struct.hasLoops && wordCount > 25)
                                  out.push('No loop constructs found — if the problem requires iteration, this is a critical omission.');
  if (!struct.hasIO)              out.push('Input and Output are not defined — the algorithm should explicitly state what it accepts and returns.');
  if (wordCount < 25)            out.push('Submission is too brief to demonstrate complete understanding of the problem.');
  if (poor.length > 0)           out.push(`${poor.length} rubric criteria remain inadequately addressed or missing entirely.`);
  if (!struct.hasComparisons && pct < 0.5)
                                  out.push('No comparison operations detected — the algorithm may lack necessary decision logic.');

  if (out.length === 0) {
    out.push('No critical structural issues detected. Review individual criterion feedback for targeted improvements.');
  }

  return out.slice(0, 4);
}

/* ── Suggestions Builder ─────────────────────────── */
function buildSuggestions(struct, wordCount, lineCount, criteria) {
  const out = [];

  if (!struct.hasStart)           out.push('Begin your algorithm with "START" or "BEGIN" to clearly mark the entry point.');
  if (!struct.hasEnd)             out.push('End your algorithm with "END" or "STOP" to mark its termination.');
  if (!struct.hasNumberedSteps)   out.push('Use numbered steps (Step 1, Step 2, …) to organise your algorithm logically.');
  if (!struct.hasConditions)      out.push('Add IF/ELSE conditions where a decision or comparison needs to be made.');
  if (!struct.hasLoops)           out.push('Include WHILE, FOR, or REPEAT…UNTIL constructs where repetition is required.');
  if (!struct.hasIO)              out.push('Explicitly state your INPUT (what data is received) and OUTPUT (what is produced).');
  if (!struct.hasVariables)       out.push('Declare and initialise all variables clearly before use (e.g., SET counter = 0).');
  if (!struct.hasSwap && criteria.some(c => /swap|exchange/.test(c.name.toLowerCase())))
                                  out.push('For swap operations, use a temporary variable: TEMP = A[j]; A[j] = A[j+1]; A[j+1] = TEMP.');
  if (wordCount < 40)            out.push('Expand your submission with more detail — each logical step should be explicitly written out.');
  if (!struct.hasErrorHandling)   out.push('Handle edge/boundary cases (e.g., empty list, out-of-range index, stack overflow).');

  out.push('Review each rubric criterion individually and ensure your submission explicitly addresses every point.');
  out.push('Use standard pseudocode conventions (capital keywords, indentation) for maximum clarity and evaluation accuracy.');

  return out.slice(0, 6);
}
