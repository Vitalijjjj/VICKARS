/**
 * UI dictionaries. RU and EL are working translations — review with a native speaker before launch.
 */
export const locales = ['uk', 'ru', 'el'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'uk';

/** Label shown in the language switcher (brief requires UA / RU / EL). */
export const localeLabel: Record<Locale, string> = { uk: 'UA', ru: 'RU', el: 'EL' };
export const localeName: Record<Locale, string> = { uk: 'Українська', ru: 'Русский', el: 'Ελληνικά' };

const uk = {
  'meta.title': 'VIK Cars — преміум-мийка та детейлінг у Лімасолі',
  'meta.description': 'VIK Cars — ручна мийка преміум-класу, детейлінг, PPF, кераміка, тонування й тюнінг з лаунжем на час обслуговування. Лімасол, Кіпр.',
  'nav.label': 'Основна навігація',
  'nav.complex': 'Комплекс',
  'nav.services': 'Послуги',
  'nav.selfWash': 'Самомийка',
  'nav.process': 'Як це працює',
  'nav.clients': 'Наші клієнти',
  'nav.pricing': 'Тарифи',
  'nav.benefits': 'Переваги',
  'nav.reviews': 'Відгуки',
  'nav.contacts': 'Контакти',
  'nav.more': 'Ще',
  'nav.menu': 'Меню',
  'nav.close': 'Закрити',
  'nav.home': 'VIK Cars — на головну',
  'nav.language': 'Мова сайту',
  'nav.group.space': 'Простір',
  'nav.group.service': 'Сервіс',
  'nav.group.trust': 'Довіра',
  'nav.group.contact': 'Звʼязок',
  'cta.book': 'Записатися',
  'state.soon': 'Незабаром',
  'hero.label': 'VIK Cars — вступ',
  'hero.alt': 'VIK Cars — фасад комплексу',
  'hero.caption': 'Детейлінг-центр · Лімасол',
  'hero.scroll': 'Гортайте, щоб дослідити',
  'levels.title': 'Рівні комплексу',
  'levels.hint': 'Оберіть рівень',
  'levels.open': 'Сторінка напрямку',
  'levels.close': 'Закрити прев’ю',
  'level.up1.text': 'Лаунж-зона та шоурум',
  'level.ground.text': 'Ручна мийка преміум-класу',
  'level.down1.text': 'Детейлінг, PPF, кераміка, тюнінг',
  'level.up1.short': 'Лаунж',
  'level.ground.short': 'Мийка',
  'level.down1.short': 'Детейлінг',
} as const;

export type UIKey = keyof typeof uk;

export const ui: Record<Locale, Record<UIKey, string>> = {
  uk,
  ru: {
    'meta.title': 'VIK Cars — премиум-мойка и детейлинг в Лимасоле',
    'meta.description': 'VIK Cars — ручная мойка премиум-класса, детейлинг, PPF, керамика, тонировка и тюнинг с лаунжем на время обслуживания. Лимасол, Кипр.',
    'nav.label': 'Основная навигация',
    'nav.complex': 'Комплекс',
    'nav.services': 'Услуги',
    'nav.selfWash': 'Самомойка',
    'nav.process': 'Как это работает',
    'nav.clients': 'Наши клиенты',
    'nav.pricing': 'Тарифы',
    'nav.benefits': 'Преимущества',
    'nav.reviews': 'Отзывы',
    'nav.contacts': 'Контакты',
    'nav.more': 'Ещё',
    'nav.menu': 'Меню',
    'nav.close': 'Закрыть',
    'nav.home': 'VIK Cars — на главную',
    'nav.language': 'Язык сайта',
    'nav.group.space': 'Пространство',
    'nav.group.service': 'Сервис',
    'nav.group.trust': 'Доверие',
    'nav.group.contact': 'Связь',
    'cta.book': 'Записаться',
    'state.soon': 'Скоро',
    'hero.label': 'VIK Cars — вступление',
    'hero.alt': 'VIK Cars — фасад комплекса',
    'hero.caption': 'Детейлинг-центр · Лимасол',
    'hero.scroll': 'Прокрутите, чтобы исследовать',
    'levels.title': 'Уровни комплекса',
    'levels.hint': 'Выберите уровень',
    'levels.open': 'Страница направления',
    'levels.close': 'Закрыть превью',
    'level.up1.text': 'Лаунж-зона и шоурум',
    'level.ground.text': 'Ручная мойка премиум-класса',
    'level.down1.text': 'Детейлинг, PPF, керамика, тюнинг',
    'level.up1.short': 'Лаунж',
    'level.ground.short': 'Мойка',
    'level.down1.short': 'Детейлинг',
  },
  el: {
    'meta.title': 'VIK Cars — premium πλύσιμο και detailing στη Λεμεσό',
    'meta.description': 'VIK Cars — χειροποίητο πλύσιμο premium, detailing, PPF, κεραμική, φιμέ και tuning, με lounge όσο περιμένετε. Λεμεσός, Κύπρος.',
    'nav.label': 'Κύρια πλοήγηση',
    'nav.complex': 'Συγκρότημα',
    'nav.services': 'Υπηρεσίες',
    'nav.selfWash': 'Self-service',
    'nav.process': 'Πώς λειτουργεί',
    'nav.clients': 'Οι πελάτες μας',
    'nav.pricing': 'Τιμές',
    'nav.benefits': 'Πλεονεκτήματα',
    'nav.reviews': 'Κριτικές',
    'nav.contacts': 'Επικοινωνία',
    'nav.more': 'Περισσότερα',
    'nav.menu': 'Μενού',
    'nav.close': 'Κλείσιμο',
    'nav.home': 'VIK Cars — αρχική',
    'nav.language': 'Γλώσσα ιστότοπου',
    'nav.group.space': 'Χώρος',
    'nav.group.service': 'Υπηρεσίες',
    'nav.group.trust': 'Εμπιστοσύνη',
    'nav.group.contact': 'Επικοινωνία',
    'cta.book': 'Κράτηση',
    'state.soon': 'Σύντομα',
    'hero.label': 'VIK Cars — εισαγωγή',
    'hero.alt': 'VIK Cars — η πρόσοψη του συγκροτήματος',
    'hero.caption': 'Κέντρο detailing · Λεμεσός',
    'hero.scroll': 'Κάντε κύλιση για εξερεύνηση',
    'levels.title': 'Επίπεδα συγκροτήματος',
    'levels.hint': 'Επιλέξτε επίπεδο',
    'levels.open': 'Σελίδα κατεύθυνσης',
    'levels.close': 'Κλείσιμο προεπισκόπησης',
    'level.up1.text': 'Lounge και εκθεσιακός χώρος',
    'level.ground.text': 'Χειροποίητο πλύσιμο premium',
    'level.down1.text': 'Detailing, PPF, κεραμική, tuning',
    'level.up1.short': 'Lounge',
    'level.ground.short': 'Πλύσιμο',
    'level.down1.short': 'Detailing',
  },
};

export function useTranslations(locale: Locale) {
  return (key: UIKey) => ui[locale][key] ?? ui[defaultLocale][key];
}

export function localePath(locale: Locale, path = '/') {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return locale === defaultLocale ? clean : `/${locale}${clean === '/' ? '/' : clean}`;
}
