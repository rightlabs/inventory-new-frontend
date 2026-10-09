// Short, plain explanations for the words used on the MIS screens.
// Hindi first (shop language), English below. 1–2 short lines each.

export interface MisTerm {
  /** Name as printed on the screen. */
  title: string;
  /** Same name in Hindi. */
  hiTitle: string;
  hi: string;
  en: string;
}

export const MIS_TERMS = {
  moneyIn: {
    title: "Money in",
    hiTitle: "पैसा आया",
    hi: "इन तारीखों में ग्राहकों से जितना पैसा मिला — कैश, ऑनलाइन और चेक मिलाकर।",
    en: "All money received from customers in these dates — cash, online and cheque.",
  },
  moneyOut: {
    title: "Money out",
    hiTitle: "पैसा गया",
    hi: "इन तारीखों में जितना पैसा दिया — वेंडर को भुगतान, भाड़ा, और ग्राहक को लौटाया पैसा।",
    en: "All money paid out — to vendors, for freight, and refunds to customers.",
  },
  net: {
    title: "Net (In − Out)",
    hiTitle: "आया − गया",
    hi: "आया पैसा घटा गया पैसा। प्लस हो तो ज़्यादा आया, माइनस हो तो ज़्यादा गया।",
    en: "Money in minus money out. Plus: more came in. Minus: more went out.",
  },
  sales: {
    title: "Sales",
    hiTitle: "बिक्री",
    hi: "बिलों में बेचे गए माल की कुल रकम। रद्द हुए बिल नहीं गिने जाते।",
    en: "Value of goods billed to customers. Cancelled bills are not counted.",
  },
  cost: {
    title: "Cost (COGS)",
    hiTitle: "माल की लागत",
    hi: "जो माल बेचा, वह हमें कितने में पड़ा — भाड़ा मिलाकर। वापस आए माल की लागत घटा दी जाती है।",
    en: "What the sold goods cost us, freight included. Cost of goods that came back is taken off.",
  },
  grossProfit: {
    title: "Gross profit",
    hiTitle: "मुनाफ़ा",
    hi: "मुनाफ़ा = बिक्री − वापसी − लागत। किराया, तनख़्वाह जैसे खर्चे इसमें नहीं घटे।",
    en: "Profit = Sales − Returns − Cost. Shop expenses like rent or salary are not taken off.",
  },
  margin: {
    title: "Margin",
    hiTitle: "मार्जिन %",
    hi: "हर ₹100 की बिक्री पर कितना मुनाफ़ा बचा। जैसे 8% = ₹100 पर ₹8।",
    en: "Profit on every ₹100 of sales. 8% means ₹8 on ₹100.",
  },
  returns: {
    title: "Returns",
    hiTitle: "वापसी",
    hi: "ग्राहक ने जो माल वापस किया, उसकी रकम। जिस दिन माल वापस आया, उसी दिन गिना जाता है।",
    en: "Value of goods customers sent back, counted on the day they came back.",
  },
  cashBook: {
    title: "Cash Book",
    hiTitle: "रोकड़ बही",
    hi: "हर दिन का पैसे का हिसाब — किससे आया, किसे गया, और कैसे (कैश / ऑनलाइन / चेक)।",
    en: "Day-by-day record of every rupee in and out — who, how and how much.",
  },
  advance: {
    title: "Advance",
    hiTitle: "एडवांस",
    hi: "ग्राहक ने माल लेने से पहले जो पैसा दे दिया। यह आगे के बिलों में कट जाता है।",
    en: "Money a customer paid before buying. It is used against later bills.",
  },
  notRecorded: {
    title: "Not recorded",
    hiTitle: "तरीका नहीं लिखा",
    hi: "इस पैसे का तरीका (कैश / ऑनलाइन / चेक) एंट्री में नहीं लिखा गया।",
    en: "The payment mode (cash / online / cheque) was not entered for this money.",
  },
  costBack: {
    title: "Cost back",
    hiTitle: "लागत वापस",
    hi: "माल वापस आया, इसलिए उसकी लागत हटा दी गई।",
    en: "Goods came back, so their cost is removed.",
  },
} as const satisfies Record<string, MisTerm>;

export type MisTermKey = keyof typeof MIS_TERMS;
