"""famous_quotes URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from quotes import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('home/', views.HomeScreenView),

    path('users/', views.UserView),
    path('login/', views.LoginView),
    path('logout/', views.LogoutView),
    path('validate/', views.ValidateSessionView),

    path('votes/', views.VoteView),
    path('categories/', views.CategoriesView),
    path('quote-list/', views.QuoteListView),
    path('quotes/', views.QuoteView),
    path('comments/', views.CommentView),

    path('quotes/report/', views.QuoteReportView),
    path('quotes/qotd/', views.QuoteOfTheDayView),

    path('forgot-password/', views.ForgotPasswordView),
    path('reset-password/', views.ResetPasswordView),

    path('analytics/', views.AnalyticsView),

    path('test/', views.TestView),
]
