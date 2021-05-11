import { Member } from './../../interfaces/member';
import { AuthService } from './../../services/auth.service';
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parseDomain, ParseResultType } from "parse-domain";
import { DomSanitizer } from '@angular/platform-browser';
import * as _ from 'lodash';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
@Component({
  selector: 'app-meet-the-team',
  templateUrl: './meet-the-team.component.html',
  styleUrls: ['./meet-the-team.component.scss']
})
export class MeetTheTeamComponent implements OnInit {
  members: Observable<{ data: Member[] }>;
  memberList: Member[]
  edit: boolean = false;
  isCollapsed: boolean[] = [];
  currentMember: Member;
  profileForm: FormGroup;


  constructor (private sanitizer: DomSanitizer, private http: HttpClient, private fb: FormBuilder, public authService: AuthService) {
    this.members = (this.http.get(`${environment.apiUrl}allTeamMembers`) as Observable<{ data: Member[] }>);
    this.refreshMembersList();
  }

  async refreshMembersList () {
    this.memberList = (await this.members.toPromise()).data;
    this.memberList.forEach((_val, index) => { this.isCollapsed[index] = true });
  }

  ngOnInit () {
    this.resetForm();
  }
  isTeamMember (email: string, members: Member[] = []) {
    this.currentMember = members[members.findIndex(member => member.Email.toLowerCase() === email.toLowerCase())];
    return members?.map((member: Member) => member.Email.toLowerCase()).includes(email.toLowerCase());
  }

  cleanLink (url: string) {
    // console.log(url);
    // console.log(this.sanitizer.bypassSecurityTrustUrl(url.split(" ").join("")));
    return this.sanitizer.bypassSecurityTrustUrl(url.split(" ").join(""));
  }

  getDomainName (url: string) {
    url = url.trim();
    const parseResult = parseDomain(
      // This should be a string with basic latin characters only.
      // More information below.
      _.replace(url, /(https:\/\/)|(http:\/\/)|(\/.+)|(\s)/g, '')
    );
    // console.log(_.replace(url, /(https:\/\/)|(http:\/\/)|(\/.+)|(\s)/g, ''));
    // Check if the domain is listed in the public suffix list
    if (parseResult.type === ParseResultType.Listed) {
      const { domain } = parseResult;
      return domain
    } else {
      return null;
    }
  }
  urlToIcon (url: string) {
    const domain = this.getDomainName(url);
    // console.log(domain);
    switch (domain) {
      case 'twitter':
        return 'fab fa-twitter';
      case 'linkedin':
        return 'fab fa-linkedin';
      case 'orcid':
        return 'fab fa-orcid';
      case 'github':
        return 'fab fa-github';
      default:
        return 'fas fa-graduation-cap';
    }
  }

  async profileTable () {
    // console.log(this.profileForm.value);
    const update = {
      id: this.currentMember.ID,
      name: this.profileForm.value.name,
      email: this.currentMember.Email,
      position: this.profileForm.value.position,
      social_media: this.profileForm.value.socialMedias.join(';'),
      description: this.profileForm.value.description,
      token: this.authService.token
    };
    // console.log(update);
    // console.log(this.currentMember);
    // console.log('Users Email:', this.authService.user.email);
    if (this.authService.user.email === this.currentMember.Email) {
      try {
        await this.http
          .patch(
            `${environment.apiUrl}profileUpdate/?`,
            JSON.stringify(update),
            {
              headers: { 'content-type': 'application/json' }
            }
          )
          .toPromise();
        this.refreshMembersList();
      } catch (err) {
        console.log(err);
      }
    }
  }

  resetForm () {
    this.profileForm = this.fb.group({
      name: [''],
      position: [''],
      socialMedias: this.fb.array([new FormControl('')]),
      description: [''],
    });
    this.profileForm.reset(this.profileForm.value);
  }

  addSocialMedia () {
    const control = new FormControl('');
    this.socialMedias.push(control);
  }
  removeSocialMedia (i) {
    this.socialMedias.removeAt(i);
  }

  updateProfileForm () {
    this.edit = !this.edit;
    const { Name, Position, Social_Media, Description } = this.currentMember;
    const socialMediaLinks = Social_Media.split(';')
      .filter(link => link !== '');
    if (socialMediaLinks.length > this.socialMedias.length) {
      while (socialMediaLinks.length !== this.socialMedias.length) {
        this.addSocialMedia();
      }
    } else {
      while (socialMediaLinks.length !== this.socialMedias.length) {
        this.removeSocialMedia(this.socialMedias.length - 1);
      }
    }
    this.profileForm.setValue({
      name: Name,
      position: Position,
      socialMedias:
        socialMediaLinks || [''],
      description: Description
    });
  }
  get socialMedias () {
    return this.profileForm.get('socialMedias') as FormArray;
  }
}
