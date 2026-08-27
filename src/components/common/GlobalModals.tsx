import React from 'react';
import { useApp } from '../../context/AppContext';
import { BookingModal } from '../booking/BookingModal';
import { SocialLoginModal } from './SocialLoginModal';
import { CustomerMessageModal } from '../admin/CustomerMessageModal';
import { EmailNotificationModal } from './EmailNotificationModal';
import { RescheduleModal } from '../admin/RescheduleModal';
import { DeclineAppointmentModal } from '../admin/DeclineAppointmentModal';

export const GlobalModals: React.FC = () => {
  const {
    services,
    professionals,
    appointments,
    businessHours,
    blockedTimes,
    settings,
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

      {/* Social Login Modal */}
      <SocialLoginModal />

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
