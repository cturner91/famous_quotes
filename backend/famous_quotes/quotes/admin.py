from django.contrib import admin
from .models import *

class QuoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'author', 'quote', 'duplicate_votes', 'offensive_votes', 'misattribution_votes', 'popularity')
    list_filter = ('misattribution_resolved', 'created_at', 'categories', 'author')
    search_fields = ('quote','author','categories')

class AnalyticAdmin(admin.ModelAdmin):
    list_display = ('id', 'datetime', 'user', 'session_id', 'action')
    list_filter = ('user', 'action', 'session_id', 'created_at')
    search_fields = ('action', 'session_id')

class VoteAdmin(admin.ModelAdmin):
    list_display = ('id', 'created_at', 'session_id', 'value', 'short_description')
    list_filter = ('created_at', 'value', 'session_id')
    readonly_fields = ('created_at',)

class QuoteListAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'name', 'external_id')
    list_filter = ('created_at', 'user__email')
    filter_horizontal = ('quotes',)

class QotdAdmin(admin.ModelAdmin):
    list_display = ('date', 'category', 'quote')
    list_filter = ('date', 'category')

class CommentAdmin(admin.ModelAdmin):
    def email(self, obj):
        return obj.user_session.user.email
    def quote_capped(self, obj):
        return f'{obj.quote.quote[:30]}...' if obj.quote else '-'
    list_display = ('created_at', 'email', 'quote_capped', 'comment')
    list_filter = ('created_at', 'user_session__user__email')

class IpMonitorAdmin(admin.ModelAdmin):
    list_display = ('id', 'ip_address', 'datetime', 'count')
    list_filter = ('ip_address', 'datetime')

class IpThrottleAdmin(admin.ModelAdmin):
    list_display = ('id', 'ip_address', 'created_at', 'block_expires')
    list_filter = ('ip_address', 'created_at')

class UserSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'session_username', 'session_key')
    list_filter = ('session_key', 'user__email')


admin.site.register(Quote, QuoteAdmin)
admin.site.register(Analytic, AnalyticAdmin)
admin.site.register(Vote, VoteAdmin)
admin.site.register(QuoteList, QuoteListAdmin)
admin.site.register(QuoteOfTheDay, QotdAdmin)
admin.site.register(Comment, CommentAdmin)

admin.site.register(Category)
admin.site.register(UserSession, UserSessionAdmin)
admin.site.register(IpMonitor, IpMonitorAdmin)
admin.site.register(IpThrottle, IpThrottleAdmin)
