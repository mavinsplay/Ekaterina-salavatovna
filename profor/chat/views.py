from django.shortcuts import render

def chat_page(request):
    return render(request, "chat/chat.html")

def start_page(request):
    return render(request, "chat/start.html")