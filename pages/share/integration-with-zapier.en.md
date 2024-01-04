# Integration - 왈라 Zapier 설정 가이드

설문조사를 받고, 응답이 왔는지 오지 않았는지를 어떻게 확인하고 계시나요? 보통은 직접 들어가서 확인하는 경우가 많습니다. 왈라는 업무의 효율성을 극대화하고자, 설문 응답을 받았을 때 알림과 같이 특정 행동을 수행할 수 있는 자동화를 지원합니다. 오늘은 그 자동화를 어떻게 설정하실 수 있는지 알려드릴게요!

### 어디에서 확인하나요?

왈라 → 공유하기의 최하단에서 Integration을 확인하실 수 있습니다. 왈라는 5,000개 이상의 서비스와 연결될 수 있도록 국내 최초로 zapier 연동을 했습니다. zapier에 들어가셔서 보다 본격적으로 연동을 하신다면, 여기 보이는 기능 이외에도 수많은 기능을 사용이 가능합니다.

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled.png)

### 어떻게 연동하나요?

연결 방법은 기능마다 조금씩 다르지만, 연동 자체에 어려움을 겪고 계실 분들을 위해 예시로 하나 연결해보겠습니다. 응답이 올 때마다 Gmail로 알림을 받고 싶었다고 가정해보겠습니다. 그러면 저는 Integration 부분에 있는 ‘Send Gmail emails for new Walla Form submissions’를 누를 것입니다.

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled%201.png)

이러한 화면이 나타나게 되는데요, zapier라는 서비스에 대한 회원가입이 이미 되어있다면 우측 상단의 Log in을 눌러 로그인 해주시고, 그렇지 않으시다면 본 화면에서 회원가입을 해주세요.

회원가입/로그인 이후에는 아래와 같은 화면을 보실 수 있습니다.

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled%202.png)

여기에 **느낌표 표시가 되어있는 부분을 체크 표시로 바꾼다** 라고 생각하시면서 절차를 진행해주세요. 예를 들어, 아래 화면에서 Account에 느낌표가 있으므로, 아래 Sign in을 진행해주시면 됩니다!

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled%203.png)

이 Trigger은 어떤 프로젝트에 자동화를 적용하고 싶은지에 대한 질문입니다. 해당하는 프로젝트를 눌러주세요.

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled%204.png)

왈라 부분에 대한 모든 조건이 충족되면, Test your trigger이 나오는데요, 말 그대로 왈라와 zapier가 잘 연결되는지를 테스트해보는 과정입니다.

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled%205.png)

Test trigger 버튼을 누르시면, Gmail 부분이 나옵니다. 여기에서도 아까와 동일하게, 느낌표를 체크 표시로 바꾼다고 생각하고 설정해주세요!

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled%206.png)

Zapier에 Google 계정 엑세스를 허가해주시면, 아래와 같이 아까 시도하고자 했던 Test Trigger을 시행할 수 있게 됩니다.

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled%207.png)

모든 테스트가 끝나시고 마지막에 Publish를 누르면, 알림이 연동됩니다!

![Untitled](src/afbc98ce2f3c4fc4b3947d13600d76b2/Untitled%208.png)

사실 길게 설명을 적었지만, 워낙 zapier가 어렵지 않은 ui로 되어있어서 **하나씩 파란 버튼을 누르며 테스크를 해결한다!**는 생각으로 차근차근 하시다보면 연결이 된답니다. 재피어, 어렵지 않죠?
