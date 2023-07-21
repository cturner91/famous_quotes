import React from "react"
import {
  BrowserRouter as Router,
  Routes,
  Route
} from "react-router-dom"

import { GlobalContextProvider } from "./data/GlobalContext"

import HomeScreen from "./screens/HomeScreen"
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import AccountScreen from "./screens/AccountScreen"
import QuotesScreen from "./screens/QuotesScreen"
import QuoteScreen from "./screens/QuoteScreen"
import QotdScreen from "./screens/QotdScreen"
import AddQuoteScreen from "./screens/AddQuoteScreen"
import QuoteViewScreen from "./screens/QuoteViewScreen"
import ContactScreen from "./screens/ContactScreen"
import DeveloperInfoScreen from "./screens/DeveloperInfoScreen"
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen"
import FeaturesScreen from "./screens/FeaturesScreen"
import PasswordResetScreen from "./screens/PasswordResetScreen"
import PasswordForgotScreen from "./screens/PasswordForgotScreen"
import QuotelistScreen from "./screens/QuotelistScreen"
import { APP_LOGIN_URL, APP_URL, APP_REGISTER_URL, APP_QOTD_URL, APP_QUOTE_URL, APP_QUOTES_URL, APP_QUOTE_VIEW_URL, APP_ADD_QUOTE_URL, APP_ACCOUNT_URL, APP_DEVELOPER_URL, APP_PRIVACY_URL, APP_CONTACT_URL, APP_FEATURES_URL, APP_PASSWORD_RESET, APP_PASSWORD_FORGOT, APP_QUOTELIST_URL, APP_ABOUT_URL, APP_TERMS_URL } from "./data/constants"
import './App.css'
import AboutScreen from "./screens/AboutScreen"
import TermsScreen from "./screens/TermsScreen"
import NotFoundScreen from "./screens/NotFoundScreen"


const App = (props) => {
  return (
    <GlobalContextProvider>
      <Router>
          <Routes>
            <Route path={APP_URL} element={<HomeScreen/>}></Route>
            <Route path={APP_LOGIN_URL} element={<LoginScreen/>}></Route>
            <Route path={APP_REGISTER_URL} element={<RegisterScreen/>}></Route>
            <Route path={APP_QOTD_URL} element={<QotdScreen/>}></Route>
            <Route path={APP_QUOTE_URL} element={<QuoteScreen/>}></Route>
            <Route path={APP_QUOTES_URL} element={<QuotesScreen/>}></Route>
            <Route path={APP_QUOTE_VIEW_URL} element={<QuoteViewScreen/>}></Route>
            <Route path={APP_ADD_QUOTE_URL} element={<AddQuoteScreen/>}></Route>
            <Route path={APP_ACCOUNT_URL} element={<AccountScreen/>}></Route>
            <Route path={APP_DEVELOPER_URL} element={<DeveloperInfoScreen/>}></Route>
            <Route path={APP_PRIVACY_URL} element={<PrivacyPolicyScreen/>}></Route>
            <Route path={APP_CONTACT_URL} element={<ContactScreen/>}></Route>
            <Route path={APP_FEATURES_URL} element={<FeaturesScreen/>}></Route>
            <Route path={APP_PASSWORD_RESET} element={<PasswordResetScreen/>}></Route>
            <Route path={APP_PASSWORD_FORGOT} element={<PasswordForgotScreen/>}></Route>
            <Route path={APP_QUOTELIST_URL} element={<QuotelistScreen/>}></Route>
            <Route path={APP_ABOUT_URL} element={<AboutScreen/>}></Route>
            <Route path={APP_TERMS_URL} element={<TermsScreen/>}></Route>
            <Route path='*' element={<NotFoundScreen />}/>
          </Routes>
      </Router>
    </GlobalContextProvider>
  );
}

export default App
