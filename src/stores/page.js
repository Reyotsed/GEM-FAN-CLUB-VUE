import { defineStore } from 'pinia';


export const usePageStore = defineStore('page', {
    state: () => ({
      page: "homePage",
    }),
    actions: {
        jumpToHomePage() {
            this.page = "homePage";
        },
        jumpToSongPage() {
            this.page = "songPage";
        },
        jumpToQuotePage() {
            this.page = "quotePage";
        },
        jumpToVideoPage() {
            this.page = "videoPage";
        },
        jumpToPicturePage(){
            this.page = "picturePage";
        },
        jumpToShopPage(){
            this.page = "shopPage";
        },
        jumpToAIPage(){
            this.page = "AIPage";
        },
        jumpToInfoPage(){
            this.page = "InfoPage";
        }
    },
  });