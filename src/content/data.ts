// Structured content: questions, workflows, tiers and phases.
// Every string is taken verbatim from the reference build (agentic-readiness.html).
// Tier timelines and ranges are as published in Hashinclude's Insight 09 (May 2026).

export type Lang = 'en' | 'ar';
export type L = Record<Lang, string>;

export interface Choice { id: string; en: string; ar: string }
export interface Option extends Choice { s: 0 | 1 | 2 | 3 }
export interface Question {
  id: QuestionId;
  /** snake_case key for the radar and summaries */
  key: string;
  short: L;
  axis: L;
  title: L;
  why: L;
  opts: Option[];
}
export type QuestionId = 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7';

export const SECTORS: Choice[] = [
  { id: 'retail', en: 'E-commerce & retail', ar: 'التجارة الإلكترونية والتجزئة' },
  { id: 'logistics', en: 'Logistics & distribution', ar: 'الخدمات اللوجستية والتوزيع' },
  { id: 'professional', en: 'Professional services', ar: 'الخدمات المهنية' },
  { id: 'fnb', en: 'F&B & hospitality', ar: 'الأغذية والمشروبات والضيافة' },
  { id: 'health', en: 'Healthcare clinics', ar: 'العيادات الطبية' },
  { id: 'construction', en: 'Construction', ar: 'المقاولات والإنشاءات' },
  { id: 'manufacturing', en: 'Manufacturing', ar: 'التصنيع' },
  { id: 'trading', en: 'Trading', ar: 'التجارة العامة' },
  { id: 'insurance', en: 'Insurance & financial services', ar: 'التأمين والخدمات المالية' },
  { id: 'gov', en: 'Government or regulated entity', ar: 'جهة حكومية أو خاضعة للتنظيم' },
];

export const SIZES: Choice[] = [
  { id: 's5', en: '5–20 people', ar: 'من 5 إلى 20 موظفاً' },
  { id: 's21', en: '21–50 people', ar: 'من 21 إلى 50 موظفاً' },
  { id: 's51', en: '51–200 people', ar: 'من 51 إلى 200 موظف' },
  { id: 's201', en: '201–1,000 people', ar: 'من 201 إلى 1,000 موظف' },
  { id: 's1000', en: 'More than 1,000 people', ar: 'أكثر من 1,000 موظف' },
];

export const WFCOUNT: Choice[] = [
  { id: '1', en: 'One', ar: 'واحد' },
  { id: '2-3', en: 'Two or three', ar: 'اثنان أو ثلاثة' },
  { id: '4+', en: 'Four or more', ar: 'أربعة أو أكثر' },
];

export const SYSTEMS: Choice[] = [
  { id: '1', en: 'One', ar: 'نظام واحد' },
  { id: '2-3', en: 'Two or three', ar: 'نظامان أو ثلاثة' },
  { id: '4-6', en: 'Four to six', ar: 'من أربعة إلى ستة' },
  { id: '7+', en: 'Seven or more', ar: 'سبعة أو أكثر' },
];

export const QUESTIONS: Question[] = [
  {
    id: 'q1', key: 'workflow',
    short: { en: 'Workflow definition', ar: 'تحديد سير العمل' }, axis: { en: 'Workflow', ar: 'سير العمل' },
    title: { en: 'What workflow should the agent take over?', ar: 'ما سير العمل الذي سيتولاه الوكيل؟' },
    why: { en: 'If you cannot describe it in plain language, the agent will fail to automate it.', ar: 'إن لم تستطع وصفه بلغة بسيطة، فلن يتمكن الوكيل من أتمتته.' },
    opts: [
      { id: 'a', s: 0, en: "We want AI but haven't picked a process", ar: 'نريد الذكاء الاصطناعي لكن لم نحدد عملية بعد' },
      { id: 'b', s: 1, en: 'A few ideas, nothing written down', ar: 'لدينا أفكار، ولا شيء مكتوب' },
      { id: 'c', s: 2, en: 'One clear process, roughly described', ar: 'عملية واحدة واضحة، موصوفة بشكل عام' },
      { id: 'd', s: 3, en: 'One process with inputs, steps and a success measure on paper', ar: 'عملية واحدة بمدخلاتها وخطواتها ومقياس نجاحها، مكتوبة' },
    ],
  },
  {
    id: 'q2', key: 'knowledge',
    short: { en: 'Knowledge sources', ar: 'مصادر المعرفة' }, axis: { en: 'Knowledge', ar: 'المعرفة' },
    title: { en: 'What does the agent need to read, and where is it?', ar: 'ما الذي يحتاج الوكيل إلى قراءته، وأين يوجد؟' },
    why: { en: 'Retrieval over your own documents is what grounds the agent in your reality.', ar: 'الاسترجاع من مستنداتكم هو ما يربط الوكيل بواقع عملكم.' },
    opts: [
      { id: 'a', s: 0, en: "Mostly in people's heads", ar: 'معظمها في أذهان الموظفين' },
      { id: 'b', s: 1, en: 'Scattered across email, WhatsApp and personal drives', ar: 'متفرقة بين البريد وواتساب والأجهزة الشخصية' },
      { id: 'c', s: 2, en: 'In shared folders, mostly up to date', ar: 'في مجلدات مشتركة، ومحدّثة في الغالب' },
      { id: 'd', s: 3, en: 'Organised in one place, with an owner who keeps it current', ar: 'منظمة في مكان واحد، ولها مسؤول يحدّثها' },
    ],
  },
  {
    id: 'q3', key: 'systems',
    short: { en: 'System connections', ar: 'ربط الأنظمة' }, axis: { en: 'Systems', ar: 'الأنظمة' },
    title: { en: 'How do the systems it must act on connect today?', ar: 'كيف ترتبط الأنظمة التي سيعمل عليها الوكيل حالياً؟' },
    why: { en: 'Each integration has a cost. The number and quality of integrations defines half the project.', ar: 'لكل تكامل تكلفته. عدد التكاملات وجودتها يحددان نصف المشروع.' },
    opts: [
      { id: 'a', s: 0, en: 'Paper and spreadsheets, mostly', ar: 'الورق وجداول البيانات في الغالب' },
      { id: 'b', s: 1, en: 'Cloud apps, none of them connected', ar: 'تطبيقات سحابية غير مترابطة' },
      { id: 'c', s: 2, en: 'Our main apps have APIs or exports we already use', ar: 'تطبيقاتنا الرئيسية لديها واجهات برمجية أو تصدير نستخدمه' },
      { id: 'd', s: 3, en: 'An integrated ERP or CRM with documented APIs', ar: 'نظام موارد أو إدارة عملاء متكامل بواجهات موثقة' },
    ],
  },
  {
    id: 'q4', key: 'checkpoints',
    short: { en: 'Human checkpoints', ar: 'نقاط المراجعة البشرية' }, axis: { en: 'Checkpoints', ar: 'المراجعة' },
    title: { en: 'Where does a person stay in the loop?', ar: 'أين يبقى القرار بيد الإنسان؟' },
    why: { en: 'Without explicit checkpoints you have a system you cannot defend in an audit or to a regulator.', ar: 'بدون نقاط مراجعة واضحة، يصبح لديك نظام لا يمكنك الدفاع عنه أمام مدقق أو جهة رقابية.' },
    opts: [
      { id: 'a', s: 0, en: "We haven't thought about it", ar: 'لم نفكر في ذلك بعد' },
      { id: 'b', s: 1, en: 'A manager would check things informally', ar: 'سيراجع أحد المديرين الأمور بشكل غير رسمي' },
      { id: 'c', s: 2, en: 'We know which steps need approval', ar: 'نعرف الخطوات التي تحتاج إلى اعتماد' },
      { id: 'd', s: 3, en: 'Approval rules and limits are written down and owned', ar: 'قواعد الاعتماد وحدوده مكتوبة ولها مسؤول' },
    ],
  },
  {
    id: 'q5', key: 'data',
    short: { en: 'Data residency', ar: 'موقع البيانات' }, axis: { en: 'Data', ar: 'البيانات' },
    title: { en: 'Where must the data live?', ar: 'أين يجب أن تُحفظ البيانات؟' },
    why: { en: 'Cloud, in-country, on-premise and air-gapped each change cost, capability and compliance. Decide before choosing tools.', ar: 'لكل خيار، من السحابة إلى داخل الدولة إلى الخوادم المحلية أو البيئة المعزولة، أثرٌ على التكلفة والإمكانات والامتثال. قرّر قبل اختيار الأدوات.' },
    opts: [
      { id: 'unchecked', s: 0, en: "We haven't checked", ar: 'لم نتحقق بعد' },
      { id: 'personal', s: 1, en: 'We hold personal data and the rules are unclear', ar: 'نحتفظ ببيانات شخصية والمتطلبات غير واضحة' },
      { id: 'cloud', s: 3, en: 'Cloud is fine for us', ar: 'السحابة مناسبة لنا' },
      { id: 'uae', s: 3, en: 'It must stay in the UAE', ar: 'يجب أن تبقى داخل الإمارات' },
      { id: 'airgap', s: 3, en: 'On-premise or air-gapped', ar: 'خوادم محلية أو بيئة معزولة' },
    ],
  },
  {
    id: 'q6', key: 'ownership',
    short: { en: 'Ownership after launch', ar: 'الملكية بعد الإطلاق' }, axis: { en: 'Ownership', ar: 'الملكية' },
    title: { en: 'Who owns the system after it goes live?', ar: 'من يتولى النظام بعد إطلاقه؟' },
    why: { en: 'Agentic systems need ongoing operation: drift monitoring, prompt refinement and knowledge updates.', ar: 'تحتاج الأنظمة الوكيلة إلى تشغيل مستمر: مراقبة الانحراف، وتحسين التعليمات، وتحديث المعرفة.' },
    opts: [
      { id: 'a', s: 0, en: 'We expect it to run itself', ar: 'نتوقع أن يعمل من تلقاء نفسه' },
      { id: 'b', s: 1, en: 'Our IT person would look after it', ar: 'سيتولاه مسؤول تقنية المعلومات لدينا' },
      { id: 'c', s: 2, en: 'A named owner, with vendor support', ar: 'مسؤول محدد بالاسم، بدعم من المورّد' },
      { id: 'd', s: 3, en: 'A stewardship agreement covering monitoring and updates', ar: 'اتفاقية رعاية تشمل المراقبة والتحديثات' },
    ],
  },
  {
    id: 'q7', key: 'failure',
    short: { en: 'Failure handling', ar: 'معالجة الأخطاء' }, axis: { en: 'Failure', ar: 'الأخطاء' },
    title: { en: 'When the agent gets it wrong, what happens?', ar: 'عندما يخطئ الوكيل، ماذا يحدث؟' },
    why: { en: 'Every agent will be wrong sometimes. What matters is who detects it and how it is corrected.', ar: 'كل وكيل سيخطئ أحياناً. المهم هو من يكتشف الخطأ وكيف يُصحَّح.' },
    opts: [
      { id: 'a', s: 0, en: 'A customer would tell us', ar: 'سيخبرنا أحد العملاء' },
      { id: 'b', s: 1, en: 'Someone would probably notice', ar: 'على الأرجح سيلاحظ أحدهم' },
      { id: 'c', s: 2, en: "We'd review a sample of outputs", ar: 'سنراجع عينة من المخرجات' },
      { id: 'd', s: 3, en: 'Every action is logged, reviewed and correctable', ar: 'كل إجراء مُسجّل ومُراجَع وقابل للتصحيح' },
    ],
  },
];

export const GAPFIX: Record<QuestionId, L> = {
  q1: { en: 'Write the workflow on one page: what starts it, the inputs, the steps, who does each one, and what "done" looks like.', ar: 'اكتب سير العمل في صفحة واحدة: ما الذي يبدأه، والمدخلات، والخطوات، ومن ينفذ كل خطوة، وما معنى الإنجاز.' },
  q2: { en: 'Gather the documents the agent must read (policies, price lists, contracts, past cases) into one place and name an owner who keeps them current.', ar: 'اجمع المستندات التي سيقرأها الوكيل، من سياسات وقوائم أسعار وعقود وحالات سابقة، في مكان واحد، وعيّن مسؤولاً عن تحديثها.' },
  q3: { en: 'List every system the workflow touches and how data moves in and out today: API, export or manual entry.', ar: 'اذكر كل نظام يمر به سير العمل وكيف تدخل البيانات وتخرج منه اليوم: واجهة برمجية أو تصدير أو إدخال يدوي.' },
  q4: { en: 'Mark each step as runs automatically, needs approval, or never automated, and name the approver for each.', ar: 'صنّف كل خطوة: تعمل تلقائياً، أو تحتاج إلى اعتماد، أو لا تُؤتمت أبداً، وحدّد اسم المعتمِد لكل منها.' },
  q5: { en: 'Check whether the workflow touches personal data and what the UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) requires, before choosing tools.', ar: 'تحقق مما إذا كان سير العمل يتضمن بيانات شخصية، وما يتطلبه قانون حماية البيانات الشخصية الإماراتي (المرسوم بقانون اتحادي رقم 45 لسنة 2021)، قبل اختيار الأدوات.' },
  q6: { en: 'Name who runs the agent after launch: monitoring drift, refining prompts and updating the knowledge base. Agree stewardship before delivery.', ar: 'حدّد من يتولى الوكيل بعد الإطلاق: مراقبة الانحراف، وتحسين التعليمات، وتحديث قاعدة المعرفة. اتفق على الرعاية قبل التسليم.' },
  q7: { en: 'Decide who detects a wrong output, how it gets corrected, and where every action is logged. The audit trail is non-negotiable in production.', ar: 'حدّد من يكتشف المخرجات الخاطئة، وكيف تُصحَّح، وأين يُسجَّل كل إجراء. سجل التدقيق شرط أساسي لأي نظام إنتاجي.' },
};

export interface Workflow { id: string; tag: string; share: number; name: L; desc: L; proof: L }

export const WORKFLOWS: Workflow[] = [
  {
    id: 'docs', tag: 'DOC', share: 50,
    name: { en: 'Document processing', ar: 'معالجة المستندات' },
    desc: { en: 'Read invoices, claims, permits or delivery notes, extract and validate the data, and queue it for approval.', ar: 'قراءة الفواتير أو المطالبات أو التصاريح أو إشعارات التسليم، واستخراج البيانات والتحقق منها، ثم إحالتها للاعتماد.' },
    proof: { en: 'Enterprise insurance quoting engine: document intelligence combined with deterministic rule engines, 127 API endpoints, v1 in production in about three weeks.', ar: 'محرك تسعير تأمين مؤسسي: ذكاء المستندات مع محركات قواعد حتمية، 127 واجهة برمجية، والإصدار الأول في الإنتاج خلال نحو ثلاثة أسابيع.' },
  },
  {
    id: 'triage', tag: 'CX', share: 45,
    name: { en: 'Customer & WhatsApp triage', ar: 'فرز استفسارات العملاء عبر واتساب' },
    desc: { en: 'Answer routine questions in Arabic and English, and route the rest with full context.', ar: 'الرد على الأسئلة المتكررة بالعربية والإنجليزية، وتحويل البقية مع السياق الكامل.' },
    proof: { en: 'Bilingual Arabic and English agents that handle intake, qualification and structured output across chat and voice.', ar: 'وكلاء ثنائيو اللغة بالعربية والإنجليزية يتولون الاستقبال والتأهيل وإعداد المخرجات المنظمة عبر المحادثة والصوت.' },
  },
  {
    id: 'leads', tag: 'LEAD', share: 40,
    name: { en: 'Lead qualification', ar: 'تأهيل العملاء المحتملين' },
    desc: { en: 'Qualify inbound enquiries, score intent and draft a proposal for review.', ar: 'تأهيل الاستفسارات الواردة، وتقييم جدية العميل، وإعداد مسودة عرض للمراجعة.' },
    proof: { en: "Hashinclude's own sales agent takes a conversation from first contact to a branded, structured proposal.", ar: 'وكيل المبيعات الخاص بـHashinclude ينقل المحادثة من أول تواصل إلى عرض منظم يحمل علامتها.' },
  },
  {
    id: 'knowledge', tag: 'KB', share: 35,
    name: { en: 'Internal knowledge Q&A', ar: 'مساعد المعرفة الداخلية' },
    desc: { en: 'Staff ask in plain language and get answers from your own policies and past cases, with sources.', ar: 'يسأل الموظفون بلغة بسيطة ويحصلون على إجابات من سياساتكم وحالاتكم السابقة، مع ذكر المصدر.' },
    proof: { en: 'Agentic AI and RAG built for regulated environments where every decision must be traceable.', ar: 'ذكاء اصطناعي وكيل مع استرجاع معزّز، مصمم للبيئات الخاضعة للتنظيم حيث يجب تتبع كل قرار.' },
  },
  {
    id: 'reporting', tag: 'BI', share: 60,
    name: { en: 'Reporting & analytics', ar: 'التقارير والتحليلات' },
    desc: { en: 'The weekly report that takes all day, pulled, reconciled and drafted automatically.', ar: 'التقرير الأسبوعي الذي يستغرق يوماً كاملاً، يُجمع ويُطابق ويُصاغ تلقائياً.' },
    proof: { en: 'NAPCO National, KSA: 40% higher supervisory efficiency and a 25% sales lift within six months, through automated monitoring and analytics.', ar: 'نابكو الوطنية في السعودية: كفاءة إشرافية أعلى بنسبة 40% وزيادة في المبيعات بنسبة 25% خلال ستة أشهر، عبر المراقبة والتحليلات الآلية.' },
  },
  {
    id: 'inventory', tag: 'INV', share: 40,
    name: { en: 'Inventory & reorder decisions', ar: 'قرارات المخزون وإعادة الطلب' },
    desc: { en: 'Forecast demand and propose transfers and reorders within agreed limits.', ar: 'توقّع الطلب واقتراح التحويلات وإعادة الطلب ضمن الحدود المعتمدة.' },
    proof: { en: 'Inventory Decision Intelligence System for retail and distribution clients, delivered in 2024.', ar: 'نظام ذكاء قرارات المخزون لعملاء التجزئة والتوزيع، سُلّم في 2024.' },
  },
];

export type TierId = 'compact' | 'standard' | 'platform' | 'sovereign';
export interface Tier { id: TierId; name: L; desc: L; time: L; inv: L; lo: number; hi: number | null }

export const TIERS: Tier[] = [
  {
    id: 'compact', name: { en: 'Compact', ar: 'المُصغّر' },
    desc: { en: 'One agentic workflow, one integration, RAG over your existing documents. Cloud-hosted. Suited to SMEs automating a real business process.', ar: 'سير عمل وكيل واحد، وتكامل واحد، واسترجاع معزّز من مستنداتكم الحالية. استضافة سحابية. مناسب للشركات الصغيرة والمتوسطة التي تؤتمت عملية فعلية.' },
    time: { en: '6 weeks', ar: '6 أسابيع' }, inv: { en: 'AED 60K–90K', ar: 'من 60 إلى 90 ألف درهم' }, lo: 60000, hi: 90000,
  },
  {
    id: 'standard', name: { en: 'Standard', ar: 'القياسي' },
    desc: { en: 'Multiple workflows and integrations for the mid-market. Includes basic governance, monitoring and a first-year stewardship retainer.', ar: 'عدة سير عمل وعدة تكاملات للشركات المتوسطة. يشمل حوكمة أساسية ومراقبة واتفاقية رعاية للسنة الأولى.' },
    time: { en: '8–12 weeks', ar: 'من 8 إلى 12 أسبوعاً' }, inv: { en: 'AED 150K–350K', ar: 'من 150 إلى 350 ألف درهم' }, lo: 150000, hi: 350000,
  },
  {
    id: 'platform', name: { en: 'Platform', ar: 'المنصة' },
    desc: { en: 'Enterprise-grade. Custom architecture, full integration surface, audit trail and ongoing operation, reliable for thousands of users.', ar: 'على مستوى المؤسسات. بنية مخصصة، وتكامل شامل، وسجل تدقيق، وتشغيل مستمر، بموثوقية تخدم آلاف المستخدمين.' },
    time: { en: '12–20 weeks', ar: 'من 12 إلى 20 أسبوعاً' }, inv: { en: 'AED 500K–1M+', ar: 'من 500 ألف إلى مليون درهم فأكثر' }, lo: 500000, hi: null,
  },
  {
    id: 'sovereign', name: { en: 'Sovereign', ar: 'السيادي' },
    desc: { en: 'Government and regulated. Air-gapped, Arabic-first deployment with custom OCR, full compliance documentation and on-premise infrastructure.', ar: 'للجهات الحكومية والخاضعة للتنظيم. نشر معزول يعتمد العربية أولاً، مع تعرّف ضوئي مخصص على النصوص، وتوثيق امتثال كامل، وبنية تحتية محلية.' },
    time: { en: '16–24 weeks', ar: 'من 16 إلى 24 أسبوعاً' }, inv: { en: 'AED 1.5M+', ar: '1.5 مليون درهم فأكثر' }, lo: 1500000, hi: null,
  },
];

export const PHASES: { t: L; d: L }[] = [
  { t: { en: 'Map the workflow and checkpoints', ar: 'رسم سير العمل ونقاط المراجعة' }, d: { en: 'Inputs, steps, approvers and the success measure, agreed in writing.', ar: 'المدخلات والخطوات والمعتمدون ومقياس النجاح، باتفاق مكتوب.' } },
  { t: { en: 'Build the knowledge layer', ar: 'بناء طبقة المعرفة' }, d: { en: 'Collect the documents, then chunking, embeddings and retrieval.', ar: 'جمع المستندات، ثم تقسيمها وتضمينها وإعداد الاسترجاع.' } },
  { t: { en: 'Connect the systems', ar: 'ربط الأنظمة' }, d: { en: 'Integrations with the systems the agent reads from and acts on.', ar: 'التكامل مع الأنظمة التي يقرأ منها الوكيل ويعمل عليها.' } },
  { t: { en: 'Orchestrate the agent', ar: 'تنسيق عمل الوكيل' }, d: { en: 'Planning, tool calls and prompt design, with the human checkpoints wired in.', ar: 'التخطيط واستدعاء الأدوات وتصميم التعليمات، مع دمج نقاط المراجعة البشرية.' } },
  { t: { en: 'Test on real cases', ar: 'الاختبار على حالات حقيقية' }, d: { en: "Run last month's real cases end to end and review every error.", ar: 'تشغيل حالات الشهر الماضي الحقيقية من البداية إلى النهاية ومراجعة كل خطأ.' } },
  { t: { en: 'Go live and observe', ar: 'الإطلاق والمراقبة' }, d: { en: 'Deployment, logging and monitoring, then handover to the named owner.', ar: 'النشر والتسجيل والمراقبة، ثم التسليم للمسؤول المحدد.' } },
];

export const SOURCE_URL = 'https://hashinclu.de/en/insights/dubai-agentic-ai-2026';
export const SITE_URL = 'https://hashinclu.de/en/';
