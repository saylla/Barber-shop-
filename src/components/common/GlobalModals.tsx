import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookingModal } from '../booking/BookingModal';
import { SocialLoginModal } from './SocialLoginModal';
import { CustomerMessageModal } from '../admin/CustomerMessageModal';
import { EmailNotificationModal } from './EmailNotificationModal';
import { RescheduleModal } from '../admin/RescheduleModal';
import { DeclineAppointmentModal } from '../admin/DeclineAppointmentModal';
import { QrCodeModal } from './QrCodeModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { CompleteProfileModal } from './CompleteProfileModal';

export const GlobalModals: React.FC = () => {
  const {
    services,
    professionals,
    appointments,
    businessHours,
    blockedTimes,
    settings,
    currentUser,
    isMessageModalOpen,
    selectedApptForMessage,
    messageModalInitialTemplate,
    rejectionReasonForMessage,
    closeMessageModal,
    isEmailModalOpen,
    selectedApptForEmail,
    closeEmailModal,
    isRescheduleModalOpen,
    selectedApptForReschedule,
    closeRescheduleModal,
    isDeclineModalOpen,
    selectedApptForDecline,
    closeDeclineModal,
    declineAppointment,
    rescheduleAppointment,
    sendCustomerMessage,
    sendEmailNotification,
    isQrCodeModalOpen,
    closeQrCodeModal,
    isChangePasswordModalOpen,
    closeChangePasswordModal,
    changeCurrentUserPassword,
    isCompleteProfileModalOpen,
    closeCompleteProfileModal,
    completeUserProfile,
  } = useApp();

  // Find target service & professional for selected appointments
  const messageService = selectedApptForMessage
    ? services.find((s) => s.id === selectedApptForMessage.serviceId) || null
    : null;
  const messageProf = selectedApptForMessage
    ? professionals.find((p) => p.id === selectedApptForMessage.professionalId) || null
    : null;

  const emailService = selectedApptForEmail
    ? services.find((s) => s.id === selectedApptForEmail.serviceId) || null
    : null;
  const emailProf = selectedApptForEmail
    ? professionals.find((p) => p.id === selectedApptForEmail.professionalId) || null
    : null;

  return (
    <>
      {/* Client Booking Flow Modal */}
      <BookingModal />

      {/* Social & Admin Login Modal */}
      <SocialLoginModal />

      {/* QR Code Balcão & Mesa Modal */}
      <QrCodeModal
        isOpen={isQrCodeModalOpen}
        onClose={closeQrCodeModal}
      />

      {/* Mandatory Change Password on First Login Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onSuccess={(newPass) => changeCurrentUserPassword(newPass)}
        userEmail={currentUser?.email}
        userName={currentUser?.name}
      />

      {/* Complete Profile (Name, Email, Phone) Modal */}
      <CompleteProfileModal
        isOpen={isCompleteProfileModalOpen}
        onClose={closeCompleteProfileModal}
        onSuccess={(name, email, phone) => completeUserProfile(name, email, phone)}
        initialName={currentUser?.name}
        initialEmail={currentUser?.email}
        initialPhone={currentUser?.phone}
      />

      {/* Admin Manual Messaging / WhatsApp Modal */}
      <CustomerMessageModal
        isOpen={isMessageModalOpen}
        onClose={closeMessageModal}
        appointment={selectedApptForMessage}
        service={messageService}
        professional={messageProf}
        settings={settings}
        initialTemplateType={messageModalInitialTemplate}
        rejectionReason={rejectionReasonForMessage}
        onMessageSent={(channel, content) => {
          if (selectedApptForMessage) {
            sendCustomerMessage(selectedApptForMessage.id, channel, content);
          }
        }}
      />

      {/* Email Notification & Voucher Preview Modal */}
      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={closeEmailModal}
        appointment={selectedApptForEmail}
        service={emailService}
        professional={emailProf}
        settings={settings}
        onResend={(email) => {
          if (selectedApptForEmail) {
            sendEmailNotification(selectedApptForEmail.id, email);
          }
        }}
      />

      {/* Reschedule Modal */}
      <RescheduleModal
        isOpen={isRescheduleModalOpen}
        onClose={closeRescheduleModal}
        appointment={selectedApptForReschedule}
        services={services}
        professionals={professionals}
        businessHours={businessHours}
        appointments={appointments}
        blockedTimes={blockedTimes}
        settings={settings}
        onReschedule={(apptId, newDate, newTime, newProfId, notifyClient) => {
          rescheduleAppointment(apptId, newDate, newTime, newProfId, notifyClient);
        }}
      />

      {/* Decline / Refuse Modal */}
      <DeclineAppointmentModal
        isOpen={isDeclineModalOpen}
        onClose={closeDeclineModal}
        appointment={selectedApptForDecline}
        onDecline={(apptId, reason, notifyClient) => {
          declineAppointment(apptId, reason, notifyClient);
        }}
      />
    </>
  );
};
