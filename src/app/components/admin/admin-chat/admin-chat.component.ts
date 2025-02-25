import { CommonModule } from '@angular/common';
import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../services/chat/chat.service';
import {
  ChatMessageDetailModel,
  ChatRoomModel,
} from '../../../model/chat.room.response';
import { ChatMessageModel } from '../../../model/chat.message.response.model';
import BaseResponseModel from '../../../model/base.response.model';
import UserResponseModel from '../../../model/user.response.model';
import ChatModel from '../../../model/chat.message.model';
import { SignalRChatService } from '../../../services/signalR/chat/signalr.service';

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-chat.component.html',
  styleUrl: './admin-chat.component.scss',
})
export class AdminChatComponent implements AfterViewChecked {
  @ViewChild('chatContainer') chatContainer!: ElementRef;
  @ViewChild('inputFocus') inputFocus!: ElementRef;
  @Output() messageAdded = new EventEmitter<void>();

  newMessage = '';
  searchQuery = '';
  listRoomChat: ChatRoomModel[] = [];
  listMessChat: ChatMessageModel[] = [];
  selectedUser: UserResponseModel = {
    userName: '',
    email: '',
    fullName: '',
    dateOfBirth: '',
    phoneNumber: '',
    gender: 1,
    avatarUrl: '',
    id: '',
  };
  accessToken = localStorage.getItem('accessToken')?.toString();
  chatRoomId: string = '';

  constructor(
    private chatService: ChatService,
    private signalRChatService: SignalRChatService
  ) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  ngOnInit() {
    if (this.accessToken) {
      this.signalRChatService
        .startConnection(this.accessToken)
        .then(() => {
          this.signalRChatService.message$.subscribe((message) => {
            if (!message) return;
            if (message.chatRoomId != this.chatRoomId) return;
            this.handleWhenChangeMessages(
              message.chatRoomId,
              message.content,
              message.createdDate,
              message.isAdmin
            );
          });
        })
        .catch((err) => {
          console.error('SignalR connection failed:', err);
        });
    }

    this.chatService.getChatRoomByAdminList(1, 10).subscribe((result) => {
      if (result.isSuccess) {
        this.listRoomChat = result.value.items;
      }
    });
  }

  selectChat(chat: ChatRoomModel) {
    if (!chat) return;
    this.chatService
      .getChatMessageList(1, 100, chat.userId)
      .subscribe((result: BaseResponseModel) => {
        this.listMessChat = result.value.items.sort(
          (a: any, b: any) =>
            new Date(a.createdDate).getTime() -
            new Date(b.createdDate).getTime()
        );
      });
    this.selectedUser = chat.user;
    this.chatRoomId = chat.chatMessage.chatRoomId;
    this.focusInput(chat.chatMessage.chatRoomId);
  }

  handleWhenChangeMessages(
    chatRoomId: string,
    message: string,
    date: string,
    isAdmin: boolean
  ) {
    const messages: ChatMessageModel = {
      user: null,
      imageUrl: '',
      content: message,
      isAdmin: isAdmin,
      isRead: isAdmin,
      readDate: '',
      chatRoomId: chatRoomId,
      createdDate: date,
      modifiedDate: null,
      createdBy: '',
      modifiedBy: '',
      isDeleted: false,
      deletedAt: null,
      id: '',
    };
    this.changeStatusRoom(chatRoomId, isAdmin, message);
    if (this.listMessChat) {
      this.listMessChat.push(messages);
    }
  }

  changeStatusRoom(
    chatRoomId: string,
    isAdmin: boolean | null,
    content: string
  ) {
    const index = this.listRoomChat.findIndex(
      (x: any) => x.chatMessage.chatRoomId === chatRoomId
    );

    if (index !== -1) {
      this.listRoomChat[index].chatMessage.isAdmin =
        isAdmin == null
          ? this.listRoomChat[index].chatMessage.isAdmin
          : isAdmin;
      this.listRoomChat[index].chatMessage.isRead =
        isAdmin == null
          ? !this.listRoomChat[index].chatMessage.isRead
          : isAdmin;
      this.listRoomChat[index].chatMessage.content =
        content == '' ? this.listRoomChat[index].chatMessage.content : content;
    }
  }

  sendMessage(newMessage: string) {
    if (newMessage.trim() === '') return;
    this.handleWhenChangeMessages(
      this.chatRoomId,
      newMessage,
      new Date().toISOString(),
      true
    );

    if (this.selectedUser) {
      var model: ChatModel = {
        content: newMessage,
        imageUrl: 'kh co',
        userId: this.selectedUser.id,
      };

      this.chatService.sendMessage(model).subscribe();
      this.newMessage = '';
      this.scrollToBottom();
    }
  }
  searchUsers() {
    // this.filteredChats = this.chats.filter((chat) =>
    //   chat.user.toLowerCase().includes(this.searchQuery.toLowerCase())
    // );
  }

  isNotificationForYou(isAdmin: any, isRead: any, content: any) {
    if (!content) return true;
    if (!isAdmin && !isRead) return false;
    return true;
  }

  isMe(chat: any) {
    if (chat.chatMessage.isAdmin) return false;
    return true;
  }

  isImage() {
    var isImage = this.selectedUser.avatarUrl.trim() != '';
    if (isImage) return false;
    return true;
  }

  isAdmin(message: ChatMessageModel) {
    if (message.isAdmin === true) return true;
    return false;
  }

  scrollToBottom(): void {
    if (this.chatContainer) {
      this.chatContainer.nativeElement.scrollTop =
        this.chatContainer.nativeElement.scrollHeight;
    }
  }

  handleInputFocus() {
    this.changeStatusRoom(this.chatRoomId, null, '');
  }

  focusInput(chatRoomId: string) {
    if (this.inputFocus && this.inputFocus.nativeElement) {
      this.inputFocus.nativeElement.focus();
      this.chatService.readAllMessage(chatRoomId).subscribe();
      this.changeStatusRoom(this.chatRoomId, null, '');
    }
  }
}
