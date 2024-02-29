# Editing Project: Hidden Field

> Hidden fields collect or track data like traffic sources without being visible to respondents.

# 🫑 Using Hidden Field Feature

- For a clearer understanding of Hidden Field feature through specific examples.


> 💡 **The Basics of using Hidden Field**
> 
> 1. In the project editing 'Settings', set the title for the hidden field.
> 2. Manually edit the link to fit the hidden field format for sharing.
> 3. When responses come in through the shared link, verify in the response sheet that the hidden fields have been applied correctly.

1. **Open the project where you want to add Hidden Fields, and on the right side of 'Edit,' open the 'Settings' tab.**
    
    ![Untitled]

2. **Click 'Edit Hidden Fields' and write the title of the desired hidden field inside the field.**

    > 💡 **Having difficulty setting the title for the Hidden Field?**
    > 
    > - The hidden field title is the name of the category when grouping the desired traffic sources.
    >     1. For example, if you upload a survey named 'Pre-booking Form' to Instagram, Email, Facebook, and YouTube, you can track the specific service of origin by setting the hidden field title as 'source,' 'service,' or 'channel.
    >     2. Another example, let's assume you upload a survey for three campaigns conducted within the company. If you want to track from which campaign a specific response originated, you can set the hidden field title as 'campaign' or similar.
    >     3. Taking different example, let's assume you upload a survey for five different pieces of content. If you want to track from which content a specific response originated, you can set the hidden field title as 'contents' or similar.
    > - There are no specific restrictions on hidden field titles, but we advise you to use lowercase English and, if possible, a simple format without spaces (or separated by underscores).
    >     - Use names for broader categories that provide intuitive meaning, rather than forms like '1' or 'a'. 

    ![Untitled]
    
    - Write Hidden Field titles in the grey fields. One field will be created per row.
    - Click 'Save,' and the Hidden Field titles will be generated.

3. **Now, modify the link of the survey to comply with the Hidden Field rules.**
    - Hidden fields work by tracking how respondents accessed the survey, reflecting the traffic source in the response sheet. If you share the survey on different services like Instagram, Email, Facebook, and YouTube, create separate links for each channel.

    > 💡 **I'll guide you on creating a survey link with hidden field rules.**
    >
    > 1. Prepare the survey link. Retrieve it from the 'Share' tab.
    >     - https://walla.my/v/QA9S0i0UfZn5rZTfSbd4
    > 2. Add a question mark '?' at the end of the link. 
    >     1. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?
    > 3. After the question mark, write one of the hidden field titles you set earlier (if there are multiple, write one first).
    >     1. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source
    > 4. After the hidden field title, add the '=' sign.
    >     1. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=
    > 5. Write a specific source name (or specific campaign, content category) to share this survey link.
    >     1. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=instagram
    >     2. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=email
    >     3. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=facebook
    >     4. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=youtube 

4. **Share the link on each channel. Responses from this link will display the traffic source in the response sheet.** 
    - For example, let's respond to the survey through the link: https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=youtube.
        
        ![Untitled]
        
    - A 'source' column is created in the response sheet, automatically recording 'youtube' as the traffic source for responses from that link.
        
        ![Untitled]
        
    - Let's respond to the survey once again through the link: https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=facebook
        
        ![Untitled]
        
    - Checking the response sheet, you'll see the survey submitted via the 'facebook' link.
        
        ![Untitled]
        
5. **You can also add multiple hidden fields to a single survey.**
    - Assuming your company runs Campaign A and B on Instagram and Facebook. The hidden field titles are set as 'campaign' for grouping A and B, and 'source' for grouping Instagram and Facebook.

    > 💡 **When adding multiple hidden fields, here's how to structure the survey link:**
    > 
    > 1. Retrieve the survey link you created earlier.
    >     1. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=instagram
    > 2. After the survey link, add the '&' sign. 
    >     1. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=instagram&
    > 3. Similarly, append 'hidden field title=campaign name'. 
    >     1. https://walla.my/v/QA9S0i0UfZn5rZTfSbd4?source=instagram&campaign=A
    
    - If you want to add more hidden fields, the rule remains the same. Write 'hidden field title=category name,' and continue with the '&' sign.

> 🙂 **Here's an example of using Hidden Fields in an actual project**

**Background :** 

- **Paprika Datalab has created a survey called 'Walla Workshop Registration Form.**
    1. PD plans to run ads on Instagram, YouTube, and Facebook (= 3 different sources)
    2. PD intends to try video ads and image ads (= 2 different formats) 
    3. PD also plans to use two different copies, 'Streamline your workflow' and 'The Ultimate Form Builder' (= 2 different content pieces)
- When responses come in, following would be what Paprika Datalab would like know more:
    1. What type of ad format receives the most responses? Which source should I prioritize for advertising, and what format and content should I choose?
    2. Jack(respondent) wrote an incredibly long registration form
        1. Which source did the respondent come from, Instagram, YouTube, or Facebook? 
        2. Which type of ad did the respondent encounter, video or image ad?
        3. What copywriting did this respondent see, 'Streamline your workflow' or 'The Ultimate Form Builder'?
- **There are two ways to address the above questions.**
    1. Request the respondent to directly provide the source, format, and content they encountered
        
        ex. ‘Where did you see the advertisement and come from? (Instagram, YouTube, Facebook)’
        
    2. Using hidden fields! ( ⇒ A much more convenient method for both respondents and the company)

**How to make Hidden Fields :** 

1. **Made three hidden field titles in the 'Settings' tab.**
    - ‘source' is both a broad category grouping Instagram, YouTube, and Facebook and the hidden field title (name of the column in the response sheet).
        - ‘form' is a broad category grouping video ads and image ads.
        - ‘contents' is a broad category grouping two copies
    
    ![Untitled]
    

2. **Generate a link for each advertising channel.**
    - You need to create 12 links (3 sources * 2 formats * 2 contents). Refer here for creating links.

> 💡 **List of Links:**
> - YouTube, Video Ad, Copy 1 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=youtube&form=video&contents=copy1
> - YouTube, Video Ad, Copy 2 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=youtube&form=video&contents=copy2
> - YouTube, Image Ad, Copy 1 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=youtube&form=image&contents=copy1
> - YouTube, Image Ad, Copy 2 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=youtube&form=image&contents=copy2
> - Instagram, Video Ad, Copy 1 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=instagram&form=video&contents=copy1
> - Instagram, Video Ad, Copy 2 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=instagram&form=video&contents=copy2
> - Instagram, Image Ad, Copy 1 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=instagram&form=image&contents=copy1
> - Instagram, Image Ad, Copy 2 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=instagram&form=image&contents=copy2
> - Facebook, Video Ad, Copy 1 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=facebook&form=video&contents=copy1
> - Facebook, Video Ad, Copy 2 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=facebook&form=video&contents=copy2
> - Facebook, Image Ad, Copy 1 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=facebook&form=image&contents=copy1
> - Facebook, Image Ad, Copy 2 : https://walla.my/v/ZfrJwikMOS8Pp3UZd0Tz?source=facebook&form=image&contents=copy2

1. **Share the generated links based on source, format, and content, and collected responses.**
2. **Reviewing the response sheet reveals the source, ad type, and content of each response.** 
    
    ![Untitled]
