import { renderToString } from 'react-dom/server';
import LandingPage from './LandingPage/LandingPage';
import Support from './LandingPage/Support';
import PrivacyPolicy from './LandingPage/PrivacyPolicy';
import TermsOfService from './LandingPage/Terms';

export async function prerender(data) {
  let Component;
  let title = 'Crammi | Free AI Study Tool to Instantly Turn Notes into Flashcards, Exams, and Quizzes';
  
  switch(data.url) {
    case '/':
      Component = LandingPage;
      break;
    case '/Support':
      Component = Support;
      title = 'Support - Crammi';
      break;
    case '/PrivacyPolicy':
      Component = PrivacyPolicy;
      title = 'Privacy Policy - Crammi';
      break;
    case '/TermsOfService':
      Component = TermsOfService;
      title = 'Terms of Service - Crammi';
      break;
    default:
      Component = LandingPage;
  }

  const html = renderToString(<Component />);

  return { 
    html,
    head: {
      lang: 'en',
      title: title
    }
  };
}