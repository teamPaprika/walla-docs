# Edit Project 2 : Setting Logic

> Let's create a comprehensive survey form on Walla! 💪🏻 


> 🫑 **The Basics of Project Editing**
> 
> ![Untitled]
> 
> 1. Add “Fields” that you want to add to your form, and write down your questions and explanations.
>     - ‘Through the 'Response Validation' setting, you can customize response types (number, text, length, regular expression) and error messages.
> 2. You can visually see how the survey will progress by viewing the “Logic”.
>     - **By enabling the 'Logic based on answers' button, you can set different questions based on the answers given.**
> 3. In the 'Settings,' you can edit the survey's colour, and add brand logo, and hidden fields.
> 4. ‘Through the 'Ending Field,' you can specify that upon survey completion, respondents are redirected to a designated URL or shown an exit page (available from the Pro plan onwards).
> 5. Once edits of the project are finished, press “Publish” Button to start receiving responses.
> - Pressing 'Publish' activates the 'Accept Responses' button, allowing respondents to submit their responses. You can deactivate the project if you want to stop receiving responses.

# 🫑 Setting Logic


> ⚠️ **‘Logic’ allows you to set up conditional branching, guiding respondents to the next question or section based on their answers.**
> 
> - Logic always starts from 0
> - I'll explain step-by-step through examples, so follow along!

### 1.) Setting Logic Based On Questions (Basic Logic setup)

☑️ No logic is currently set up. The default setting for "Move to" on the right is "Next Question," meaning that any answer will move the survey to the next question.

![Untitled]

☑️ If Question 0's "Move to" is set to Question 2, it directly connects Question 0 to Question 2, skipping Question 1.

- Surveys always start from 0. Since 1 is not connected to 0, it's not included in the logic.

![Untitled]

☑️ Let's take a look at the sample survey. You'll see that the first question, "Please select your gender," doesn't appear.

![Untitled]

☑️ Let's go back to the beginning and clear all logic. Then, I'll set the "Move to" value for Question 2 to Question 0. This means that after answering Question 2, the survey will loop back to Question 0.

- Looking at the logic, you can see that the survey starts with Question 0 and then returns to Question 0 after Question 2.
- As mentioned, surveys start from 0. With the cycle 0-1-2-0, fields 3 and 4, including the submission field, cannot be accessed. Such occurrences shouldn't happen in real surveys, correct?
- Watch the video below to see the loop structure created by the logic!

![Untitled]

[화면 기록 2024-02-02 오후 5.25.16.mov]

### 2. Setting Logic Based On Responses


> ⚠️ ‘Setting up response-based logic’ is only applicable to ‘Multiple Choice’ and ‘Open-ended’ fields.

- The described logic is question-based, where respondents move to the designated question after answering the current one, regardless of their answer.
- However, in actual surveys, the logic based on responses is also widely used.
    - Here, you can set up specific actions like routing respondents who answered 'yes' to the next question and directing those who answered 'no' to the survey submission.
- Alright, let's create a survey on "Favorite Cat Breeds Among Men in their 20s"!

**1️⃣ [Multiple Choice] As our focus is on men in their 20s, the first question asks about age. Those who select "20s" will continue, while others will be directed to submit the survey.**

**First, please activate the "Logic Based on Responses" button located in the top right corner.**

- **Method 1 :**
    - Default action: Next question (or Question 1).
    - Add ‘Logic 1’ to direct respondents not in their 20s to submit their responses.
        
        ![Untitled]
        
        > 💡 **Logic Setting**
        > 
        > - Default action : Next question
        > - If the answer to Question 0 is 'Not in their 20s,'
        > - Then 'Move to Submit Response.'
        
- **Method 2 :**
    - Default action: Submit Response.
    - Add "Logic 1" to route respondents who indicated they are in their 20s to Question 1.
        
        ![Untitled]

        > 💡 **Logic Setting**
        > 
        > - Default action : Submit response
        > - If the answer to Question 0 is 'In their 20s,'
        > - Then 'Move to Question 1' (or next question). 

**2️⃣ [Multiple Choice] For Question 1 about gender, respondents selecting "Male" will proceed, while those selecting "Female" or "Other" will be directed to submit the survey.**

- **Method 1 :**
    - Default action: Next question (or Question 2).
    - Add "Logic 1" to route respondents who did not select 'Male' to submit their responses.
        
        ![Untitled]

        > 💡 **Logic Setting**
        > 
        > - Default action: Move to the next question (or Question 2).
        > - If the answer to Question 1 is 'Not Male,'
        > - Then 'Move to Submit Response.'
        
- **Method 2 :**
    - Default action : Submit Response.
    - Add "Logic 1" to direct respondents who answered 'Male' to move to Question 1 (or the next question).
        
        ![Untitled]

        > 💡 **Logic Setting**
        > 
        > - Default action : Submit Response
        > - If the answer to Question 1 is 'Male,'
        > - Then 'Move to Question 2' (or the next question). 

**3️⃣ [Long Answer Field] In Question 2, we'll ask "Why do you like cats?" using a long answer field. Let's set it up so that if the word 'dislike' appears, the survey will end.**

- **Method 1 :**
    - Default action: Move to the next question (or Question 3).
    - Add "Logic 1" to direct respondents to submit their responses if the answer contains the word 'dislike'.
        
        ![Untitled]

        > 💡 **Logic Setting**
        > 
        > - Default action : Move to the next question (or Question 3).
        > - If the answer to Question 2 'contains' the word 'dislike,'
        > - Then 'Move to Submit Response.' 
    
    - **Method 2 :**
        - Default action : Submit Response.
        - Add "Logic 1" to move to Question 3 (or the next question) only if the answer does not contain the word 'dislike'.
            
            ![Untitled]

        > 💡 **Logic Setting**
        > 
        > - Default action : Submit Response.
        > - If the answer to Question 2 does not 'contain' the word 'dislike,'
        > - Then 'Move to Question 3' (or the next question). 

### 3. View The Logic on Display

1. **If a man in his 20s answers the survey without including the word 'dislike.'**
    
    ⏩ Expected Result: The survey will proceed smoothly until the end.
    
    [1번.mov]
    
2. **If a man in his 20s includes the word 'dislike' in his survey response.**
    
    ⏩ Expected Result: After answering Question 2, the survey will end.
    
    [2번.mov]
    
3. **If a woman in her 20s answers the survey.**
    
    ⏩ Expected Result: After answering Question 1, the survey will end.
    
    [3번.mov]
    
4. **If a person in their teens answers the survey.**
    
    ⏩ Expected Result: After answering Question 0, the survey will end.
    
    [4번.mov]

> 👑 **Now you've mastered Walla’s Logic Feature!**
