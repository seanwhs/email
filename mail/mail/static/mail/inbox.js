document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  //Submit Email on Compose Email (#compose-view) Form
  document.querySelector("#compose-form").addEventListener("submit", send_mail);

  // By default, load the inbox
  load_mailbox('inbox');
});

function send_mail(event){
  //Prevents default page behavior of reloadong after it has been submitted.
  event.preventDefault();
  
  //grab compose form fields
  const mail_recipient = document.querySelector('#compose-recipients').value;
  const mail_subject = document.querySelector('#compose-subject').value;
  const mail_body = document.querySelector('#compose-body').value;
  
  //Posting mail to Django Backend
  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
        recipients: mail_recipient,
        subject: mail_subject,
        body: mail_body
    })
  })
  .then(response => response.json())
  .then(result => {
      // Print result
      console.log(result);
      load_mailbox("sent");
  });

}

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-email-view').style.display = 'none';


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id){
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {

      // Print email
      console.log(email);
      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#single-email-view').style.display = 'block';

      // display single email
      document.querySelector('#single-email-view').innerHTML =`
        <ul class="list-group">
          <li class="list-group-item"><strong>From: </strong>${email.sender}</li>
          <li class="list-group-item"><strong>To: </strong>${email.recipients}</li>
          <li class="list-group-item"><strong>Subject: </strong>${email.subject}</li>
          <li class="list-group-item"><strong>Timestamp: </strong>${email.timestamp}</li>
          <li class="list-group-item">${email.body}</li>
        </ul>      
      `;
      //Indicate email read 
      if(!email["read"]){
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true})
        })
      }


      // Mark mail as unread  
      unread_button = document.createElement('button');
      unread_button.className = "btn btn-info m-2";
      unread_button.innerHTML = "Mark as Unread";
      unread_button.id="unread_button";
      unread_button.addEventListener('click', function() {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({ read : false })
        })
        .then(response => load_mailbox('inbox'))
      })
      document.querySelector('#single-email-view').append(unread_button);



      //Create Button to Archive or Unarchive Mail
      const archive_button = document.createElement('button');
      archive_button.innerHTML = email["archived"] ? "Unarchive":"Archive";
      archive_button.className = email["archived"] ? "btn btn-success":"btn btn-danger";
      archive_button.id="archive_button";
      mb=email["archived"] ? "inbox":"archive";

      archive_button.addEventListener('click', () => {
        fetch(`/emails/${email.id}`, {
          method: 'PUT',
          body: JSON.stringify({
              archived: !email.archived
            })
        })
        //redirect to inbox or archive 
        .then(()=>{load_mailbox(mb)})

      });      
      document.querySelector('#single-email-view').append(archive_button);

      // Remove Archive, Reply and Unread buttons from emails in sent mailbox 
      if (document.querySelector('#user-email').innerHTML === email.sender) {
        document.querySelector('#archive_button').remove();
        document.querySelector('#unread_button').remove();
        document.querySelector('#reply_button').remove();
      }

      // Remove Unread and Reply buttons from emails in archive mailbox 
      if (document.querySelector('#emails-view h3').innerHTML =="Archive"){
        document.querySelector('#unread_button').remove();
        document.querySelector('#reply_button').remove();
      }


      //reply email
      const reply_button = document.createElement('button');
      reply_button.innerHTML = "Reply";
      reply_button.className = "btn btn-primary m-2";
      reply_button.id="reply_button";
      reply_button.addEventListener('click', () => {
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;

        let subj=email.subject;
        if (subj.split(" ",1)[0] !="Re:"){
          subj="Re: " + email.subject;
        }
        
        document.querySelector('#compose-subject').value = subj;

        let mail_body = `
        On ${email['timestamp']}, ${email['sender']} wrote: ${email['body']}
        `;        
        document.querySelector('#compose-body').value = mail_body;       

      });
      document.querySelector('#single-email-view').append(reply_button);
    });
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-email-view').style.display = 'none';


  
  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

   //List mails for user's mailbox
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // loop through and display each mail in a loop
      emails.forEach(mail => {
        console.log(mail);
        //create div for each mail
        const new_mail = document.createElement('div');
        new_mail.className="list-group-item";
        new_mail.innerHTML = `
          <p style="color:blue;">Sender: ${mail.sender}</p>
          <p style="color:blue;"><strong>Subject: ${mail.subject}</strong></p>
          <p style="color:blue;">${mail.timestamp}</p>
        `;
        //Change background to grey if mail is read
        if (mail["read"]) {
          new_mail.className = "read";
        } else {
          new_mail.className = "unread";
        }        

        //Listen to view email
        new_mail.addEventListener('click', () => {
          view_email(mail.id)
        });
        document.querySelector('#emails-view').append(new_mail);
      });
      console.log(emails);
    });

}